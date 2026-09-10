import { Nack } from '@golevelup/nestjs-rabbitmq';

import { PersonListener } from './person.listener';
import type { PersonService } from './person.service';

const PERSON_CONTEXT = {
  aether: 'https://aether.zone/vocab/',
  givenName: 'aether:givenName',
  familyName: 'aether:familyName',
};

const event = (over: Record<string, unknown> = {}) => ({
  id: 'evt-1',
  type: 'aether:ResourceCreated',
  source: 'https://aether.zone/aether',
  time: '2026-09-10T12:00:00.000Z',
  subject: 'urn:aether:person:p1',
  organizationId: 'org-1',
  actor: { id: 'caller-1', type: 'User' },
  data: {
    '@context': PERSON_CONTEXT,
    '@id': 'urn:aether:person:p1',
    '@type': 'aether:Person',
    givenName: 'Ada',
    familyName: 'Lovelace',
  },
  ...over,
});

let upsert: jest.Mock;
let unlink: jest.Mock;
let listener: PersonListener;

beforeEach(() => {
  upsert = jest.fn().mockResolvedValue({ id: 'local-1' });
  unlink = jest.fn().mockResolvedValue(true);
  listener = new PersonListener({
    upsertFromEvent: upsert,
    unlinkFromSource: unlink,
  } as unknown as PersonService);
});

describe('a person prosopone announced', () => {
  it('is recorded under the IRI the event named', async () => {
    // `sourceUri` is what makes a redelivery an update rather than a second
    // Ada Lovelace, so it has to be the event's subject and nothing else.
    await listener.handle(event());

    expect(upsert).toHaveBeenCalledWith({
      organizationId: 'org-1',
      sourceUri: 'urn:aether:person:p1',
      name: 'Ada Lovelace',
      createdBy: 'caller-1',
    });
  });

  it('joins the name parts akouo has one column for', async () => {
    await listener.handle(event());

    expect(upsert.mock.calls[0][0].name).toBe('Ada Lovelace');
  });

  it('keeps a person who has only one of the two', async () => {
    await listener.handle(
      event({
        data: {
          '@context': PERSON_CONTEXT,
          '@id': 'urn:aether:person:p1',
          '@type': 'aether:Person',
          givenName: 'Prince',
        },
      }),
    );

    expect(upsert.mock.calls[0][0].name).toBe('Prince');
  });

  it('acknowledges, so the broker does not send it again', async () => {
    expect(await listener.handle(event())).toBeUndefined();
  });
});

describe('what it declines', () => {
  it('drops a message that is not an Aether event', async () => {
    const result = await listener.handle({ hello: 'world' });

    // Dropped, not requeued: it will not parse on a second reading, and
    // requeuing something that can never succeed is a loop.
    expect(result).toBeInstanceOf(Nack);
    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('ignores a resource that is not a person', async () => {
    // The exchange carries every service's events; a meeting is the ordinary
    // path here rather than a problem, so it is acknowledged and forgotten.
    const result = await listener.handle(
      event({
        subject: 'urn:aether:meeting:m1',
        data: {
          '@context': PERSON_CONTEXT,
          '@id': 'urn:aether:meeting:m1',
          '@type': 'aether:Meeting',
          title: 'Standup',
        },
      }),
    );

    expect(result).toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('drops a person with no organization', async () => {
    // `organizationId` is NOT NULL on the row, and a guess would file someone
    // where another tenant can read them.
    const { organizationId: _omitted, ...withoutOrg } = event();

    const result = await listener.handle(withoutOrg);

    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('drops a person with no name', async () => {
    const result = await listener.handle(
      event({
        data: {
          '@context': PERSON_CONTEXT,
          '@id': 'urn:aether:person:p1',
          '@type': 'aether:Person',
        },
      }),
    );

    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('does not record anything for a delete', async () => {
    const result = await listener.handle(
      event({ type: 'aether:ResourceDeleted' }),
    );

    expect(result).toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('when the database fails', () => {
  it('requeues, because the write is idempotent and may simply retry', async () => {
    upsert.mockRejectedValue(new Error('database is locked'));

    const result = await listener.handle(event());

    expect(result).toBeInstanceOf(Nack);
    expect((result as Nack).requeue).toBe(true);
  });
});

describe('a person prosopone deleted', () => {
  it('is unlinked, not removed', async () => {
    /*
     * akouo's meetings reference these people. Deleting the row would orphan
     * those participations or rewrite history to say the meeting had one fewer
     * attendee — neither of which is true. The meeting had them; prosopone
     * simply no longer keeps their details.
     */
    await listener.handle(event({ type: 'aether:ResourceDeleted' }));

    expect(unlink).toHaveBeenCalledWith('org-1', 'urn:aether:person:p1');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('acknowledges when akouo never had that person', async () => {
    // An event about a resource this service never recorded is not a failure.
    unlink.mockResolvedValue(false);

    expect(
      await listener.handle(event({ type: 'aether:ResourceDeleted' })),
    ).toBeUndefined();
  });

  it('drops a delete that names no organization', async () => {
    const { organizationId: _omitted, ...withoutOrg } = event({
      type: 'aether:ResourceDeleted',
    });

    const result = await listener.handle(withoutOrg);

    expect((result as Nack).requeue).toBe(false);
    expect(unlink).not.toHaveBeenCalled();
  });

  it('requeues when the database fails', async () => {
    unlink.mockRejectedValue(new Error('database is locked'));

    const result = await listener.handle(
      event({ type: 'aether:ResourceDeleted' }),
    );

    expect((result as Nack).requeue).toBe(true);
  });
});
