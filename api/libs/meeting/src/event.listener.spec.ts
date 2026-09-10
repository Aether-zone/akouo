import { Nack } from '@golevelup/nestjs-rabbitmq';

import { EventListener } from './event.listener';
import type { MeetingProjectionService } from './meeting.projection';

const CONTEXT = { aether: 'https://aether.zone/vocab/' };

const document = (kind: string, over: Record<string, unknown> = {}) => ({
  '@context': CONTEXT,
  '@id': 'urn:aether:event:ev1',
  '@type': ['aether:Event', kind],
  title: 'Quarterly planning',
  startTime: '2026-01-01T09:00:00.000Z',
  endTime: '2026-01-01T10:00:00.000Z',
  eventStatus: 'SCHEDULED',
  attendee: [{ '@id': 'urn:aether:person:p1' }],
  location: { '@id': 'urn:aether:place:pl1' },
  ...over,
});

const event = (over: Record<string, unknown> = {}) => ({
  id: 'evt-1',
  type: 'aether:ResourceCreated',
  source: 'https://aether.zone/aether',
  time: '2026-09-10T12:00:00.000Z',
  subject: 'urn:aether:event:ev1',
  organizationId: 'org-1',
  actor: { id: 'caller-1', type: 'User' },
  data: document('aether:Meeting'),
  ...over,
});

let upsert: jest.Mock;
let unlink: jest.Mock;
let listener: EventListener;

beforeEach(() => {
  upsert = jest.fn().mockResolvedValue({ id: 'local-1' });
  unlink = jest.fn().mockResolvedValue(true);
  listener = new EventListener({
    upsertFromEvent: upsert,
    unlinkFromSource: unlink,
  } as unknown as MeetingProjectionService);
});

describe('kinds akouo records', () => {
  it.each(['aether:Meeting', 'aether:Call'])('records a %s', async (kind) => {
    // A call is a remote meeting, and exactly the sort of thing anyone
    // records — so it earns a row here as much as a meeting does.
    await listener.handle(event({ data: document(kind) }));

    expect(upsert).toHaveBeenCalledWith(
      'org-1',
      'urn:aether:event:ev1',
      expect.objectContaining({ title: 'Quarterly planning' }),
      'caller-1',
    );
  });

  it.each([
    'aether:Appointment',
    'aether:Deadline',
    'aether:Reminder',
    'aether:OutOfOffice',
  ])('ignores a %s', async (kind) => {
    /*
     * None of these is an occasion with people that akouo could record. An
     * appointment is a slot somebody else runs, usually with no attendees
     * akouo knows — and a meeting with nobody in it is not what this is for.
     */
    const result = await listener.handle(event({ data: document(kind) }));

    expect(result).toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('ignores a resource that is not a calendar entry at all', async () => {
    const result = await listener.handle(
      event({
        subject: 'urn:aether:person:p1',
        data: {
          '@context': CONTEXT,
          '@id': 'urn:aether:person:p1',
          '@type': 'aether:Person',
          givenName: 'Ada',
        },
      }),
    );

    expect(result).toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('needs both types, so a bare Meeting from akouo is not re-projected', async () => {
    /*
     * akouo publishes its own `aether:Meeting` documents. Those carry no
     * `aether:Event`, and requiring both is what stops akouo consuming its own
     * output and projecting a meeting from the meeting it just announced.
     */
    const result = await listener.handle(
      event({
        subject: 'urn:aether:meeting:m1',
        data: {
          '@context': CONTEXT,
          '@id': 'urn:aether:meeting:m1',
          '@type': 'aether:Meeting',
          title: 'Standup',
        },
      }),
    );

    expect(result).toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('what it declines', () => {
  it('drops a message that is not an Aether event', async () => {
    const result = await listener.handle({ hello: 'world' });

    expect((result as Nack).requeue).toBe(false);
  });

  it('drops one that names no organization', async () => {
    const { organizationId: _omitted, ...withoutOrg } = event();

    const result = await listener.handle(withoutOrg);

    expect((result as Nack).requeue).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('requeues when the database fails', async () => {
    // Idempotent on `sourceUri`, so a redelivery updates rather than
    // duplicates and costs only the round trip.
    upsert.mockRejectedValue(new Error('database is locked'));

    const result = await listener.handle(event());

    expect((result as Nack).requeue).toBe(true);
  });
});

describe('an event aether deleted', () => {
  const deletion = (subject: string) => {
    const { data: _data, ...rest } = event();

    return { ...rest, type: 'aether:ResourceDeleted', subject };
  };

  it('is unlinked, not removed', async () => {
    /*
     * A projected meeting may have recordings and a transcript by now, all of
     * them akouo's own. Deleting the row would take those with it.
     */
    await listener.handle(deletion('urn:aether:event:ev1'));

    expect(unlink).toHaveBeenCalledWith('org-1', 'urn:aether:event:ev1');
  });

  it('ignores a delete for something that was never a calendar entry', async () => {
    const result = await listener.handle(deletion('urn:aether:person:p1'));

    expect(result).toBeUndefined();
    expect(unlink).not.toHaveBeenCalled();
  });
});
