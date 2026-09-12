import { Nack } from '@golevelup/nestjs-rabbitmq';

import { LocationListener } from './location.listener';
import type { LocationService } from './location.service';

const PLACE_CONTEXT = {
  aether: 'https://aether.zone/vocab/',
  name: 'aether:name',
};

const event = (over: Record<string, unknown> = {}) => ({
  id: 'evt-1',
  type: 'aether:ResourceCreated',
  source: 'https://aether.zone/aether',
  time: '2026-09-10T12:00:00.000Z',
  subject: 'urn:aether:place:pl1',
  organizationId: 'org-1',
  actor: { id: 'caller-1', type: 'User' },
  data: {
    '@context': PLACE_CONTEXT,
    '@id': 'urn:aether:place:pl1',
    '@type': 'aether:Place',
    name: 'Het Sieraad',
    address: 'Postjesweg 1, 1057 DT Amsterdam',
    latitude: 52.3676,
    longitude: 4.8776,
  },
  ...over,
});

let upsert: jest.Mock;
let unlink: jest.Mock;
let listener: LocationListener;

beforeEach(() => {
  upsert = jest.fn().mockResolvedValue({ id: 'local-1' });
  unlink = jest.fn().mockResolvedValue(true);
  listener = new LocationListener({
    upsertFromEvent: upsert,
    unlinkFromSource: unlink,
  } as unknown as LocationService);
});

describe('a place topos announced', () => {
  it('is recorded under the IRI the event named', async () => {
    // `uri` is what makes a redelivery an update rather than a second
    // "Het Sieraad", so it has to be the event's subject and nothing else.
    await listener.handle(event());

    expect(upsert).toHaveBeenCalledWith({
      organizationId: 'org-1',
      uri: 'urn:aether:place:pl1',
      name: 'Het Sieraad',
      createdBy: 'caller-1',
    });
  });

  it('takes only the name — akouo holds nothing else about a place', async () => {
    await listener.handle(event());

    expect(Object.keys(upsert.mock.calls[0][0]).sort()).toEqual([
      'createdBy',
      'name',
      'organizationId',
      'uri',
    ]);
  });

  it('acknowledges, so the broker does not send it again', async () => {
    expect(await listener.handle(event())).toBeUndefined();
  });

  it('treats an update the same way, which is what makes replay converge', async () => {
    await listener.handle(
      event({
        type: 'aether:ResourceUpdated',
        data: { ...event().data, name: 'Renamed' },
      }),
    );

    expect(upsert.mock.calls[0][0].name).toBe('Renamed');
  });
});

describe('what it declines', () => {
  it('drops a message that is not an Aether event', async () => {
    const result = await listener.handle({ hello: 'world' });

    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('ignores a resource that is not a place', async () => {
    // The exchange carries every service's events; a person is the ordinary
    // path here rather than a problem.
    const result = await listener.handle(
      event({
        subject: 'urn:aether:person:p1',
        data: {
          '@context': PLACE_CONTEXT,
          '@id': 'urn:aether:person:p1',
          '@type': 'aether:Person',
          givenName: 'Ada',
        },
      }),
    );

    expect(result).toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('drops a place with no organization', async () => {
    const { organizationId: _omitted, ...withoutOrg } = event();

    const result = await listener.handle(withoutOrg);

    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('drops a place with no name', async () => {
    const result = await listener.handle(
      event({ data: { ...event().data, name: '   ' } }),
    );

    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('a place topos deleted', () => {
  const deletion = (subject: string) => {
    const { data: _data, ...rest } = event();

    return { ...rest, type: 'aether:ResourceDeleted', subject };
  };

  it('is unlinked, not removed', async () => {
    /*
     * A meeting can point at a location now, so dropping the row would either
     * break that reference or rewrite history to say the meeting was nowhere.
     * The meeting *was* there; aether simply no longer keeps the place. Same
     * trade as a person, and it changed the moment meetings gained a location.
     */
    await listener.handle(deletion('urn:aether:place:pl1'));

    expect(unlink).toHaveBeenCalledWith('org-1', 'urn:aether:place:pl1');
  });

  it('ignores a delete for something that was never a place', async () => {
    /*
     * A delete carries no document, so the type cannot be read from one — the
     * IRI prefix is the only thing telling a deleted place from a deleted
     * person on this queue.
     */
    const result = await listener.handle(deletion('urn:aether:person:p1'));

    expect(result).toBeUndefined();
    expect(unlink).not.toHaveBeenCalled();
  });

  it('acknowledges when akouo never had that place', async () => {
    unlink.mockResolvedValue(false);

    expect(
      await listener.handle(deletion('urn:aether:place:pl1')),
    ).toBeUndefined();
  });
});

describe('when the database fails', () => {
  it('requeues, because the write is idempotent and may simply retry', async () => {
    upsert.mockRejectedValue(new Error('database is locked'));

    const result = await listener.handle(event());

    expect((result as Nack).requeue).toBe(true);
  });
});
