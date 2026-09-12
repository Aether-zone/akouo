import {
  AETHER_SOURCE,
  MEETING_CREATED,
  MEETING_DELETED,
  MEETING_UPDATED,
} from '@akouo/contract';
import { aetherEventSchema } from '@aether-zone/organon';

import { MeetingService } from './meeting.service';
import { meetingIri } from './meeting.json-ld';

const actor = { id: 'user-1', organizationId: 'org-1' } as never;
const request = {
  title: 'Standup',
  startDate: '2026-01-01T09:00:00Z',
  participants: [],
};

/** What the mapper hands back — a full DTO, since the document is built from it. */
const meeting = {
  id: 'meeting-1',
  title: 'Standup',
  startDate: '2026-01-01T09:00:00Z',
  endDate: '2026-01-01T09:30:00Z',
  status: 'INITIAL',
  participants: [
    {
      id: 'participation-1',
      meetingId: 'meeting-1',
      // akouo's own row id for the person…
      personId: 'person-1',
      // …and the IRI the workspace knows them by, which is what prosopone
      // announced. The two are different identifiers for the same human, and
      // only the second belongs in a published document.
      personUri: 'urn:aether:person:from-prosopone',
    },
  ],
};

/**
 * People the meeting service will find when it checks who may be added.
 *
 * `sourceUri` non-null means prosopone still knows them, which is the whole of
 * the rule — see `MeetingService.refuseUnlinked`.
 */
const KNOWN_PEOPLE = [
  {
    id: 'person-1',
    name: 'Ada Lovelace',
    sourceUri: 'urn:aether:person:from-prosopone',
  },
];

function harness(
  publish = jest.fn().mockResolvedValue(undefined),
  people: { id: string; name: string; sourceUri: string | null }[] = KNOWN_PEOPLE,
) {
  const built = {
    leftJoinAndSelect: () => built,
    where: () => built,
    andWhere: () => built,
    orderBy: () => built,
    getOne: () => Promise.resolve({ id: 'meeting-1' }),
  };
  const meetingRepository = {
    create: (x: object) => x,
    save: jest.fn().mockResolvedValue({ id: 'meeting-1' }),
    remove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: () => built,
  };
  const meetingMapper = { toDTO: () => meeting };
  const personRepository = {
    find: jest.fn().mockResolvedValue(people),
  };
  /* Meetings resolve their location through the service, not a repository. */
  const locations = {
    findById: jest.fn().mockResolvedValue(null),
  };

  const service = new MeetingService(
    meetingRepository as never,
    personRepository as never,
    locations as never,
    meetingMapper as never,
    { publish } as never,
  );

  return { service, publish, meetingRepository, personRepository, locations };
}

/** The event a call published, with the routing key it went out under. */
const published = (publish: jest.Mock) => {
  const [routingKey, event] = publish.mock.calls[0] as [
    string,
    Record<string, unknown>,
  ];

  return { routingKey, event };
};

describe('create', () => {
  it('publishes a resource-created event carrying the document', async () => {
    const { service, publish } = harness();

    await service.create(actor, request as never);

    const { routingKey, event } = published(publish);

    expect(routingKey).toBe(MEETING_CREATED);
    expect(event).toMatchObject({
      type: 'aether:ResourceCreated',
      source: AETHER_SOURCE,
      subject: meetingIri('meeting-1'),
      organizationId: 'org-1',
      actor: { id: 'user-1', type: 'User' },
    });
  });

  it('sends the meeting as JSON-LD, not as akouo’s DTO', async () => {
    // The DTO is akouo's HTTP shape; putting it on the bus would make every
    // consumer depend on akouo's api and its idea of what a meeting is.
    const { service, publish } = harness();

    await service.create(actor, request as never);

    const { event } = published(publish);
    const data = event.data as Record<string, unknown>;

    expect(data['@type']).toBe('aether:Meeting');
    expect(data['@id']).toBe(meetingIri('meeting-1'));
    expect(data.startTime).toBe('2026-01-01T09:00:00Z');
    // Not the DTO's field names, and none of its audit columns.
    expect(data.startDate).toBeUndefined();
    expect(data.organizationId).toBeUndefined();
    expect(data.status).toBeUndefined();
  });

  it('names participants by IRI, so a graph can relate them', async () => {
    const { service, publish } = harness();

    await service.create(actor, request as never);

    const { event } = published(publish);
    const [participation] = (event.data as { participations: never[] })
      .participations as unknown as Record<string, unknown>[];

    expect(participation['@type']).toBe('aether:Participation');
    /*
     * The person's *own* IRI, not one derived from akouo's row id. Deriving
     * one used to produce a second node for the same human, so a meeting
     * referenced a participant that existed nowhere else — beside the real
     * person, whom nothing linked to.
     */
    expect(participation.participant).toEqual({
      '@id': 'urn:aether:person:from-prosopone',
    });
    expect(JSON.stringify(participation)).not.toContain('person-1');
  });

  it('still returns the meeting when the broker is down', async () => {
    const { service } = harness(
      jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    // The row is already saved; a caller must not be told it failed because a
    // queue was unreachable.
    await expect(service.create(actor, request as never)).resolves.toEqual(
      meeting,
    );
  });

  it('saves before it publishes, so nothing is announced that does not exist', async () => {
    const order: string[] = [];
    const publish = jest.fn(() => {
      order.push('publish');

      return Promise.resolve();
    });
    const { service, meetingRepository } = harness(publish);

    meetingRepository.save.mockImplementation(() => {
      order.push('save');

      return Promise.resolve({ id: 'meeting-1' });
    });

    await service.create(actor, request as never);

    expect(order).toEqual(['save', 'publish']);
  });
});

describe('update', () => {
  it('publishes a resource-updated event with the whole meeting', async () => {
    const { service, publish } = harness();

    await service.updateMeeting(actor, 'meeting-1', { title: 'Retro' });

    const { routingKey, event } = published(publish);

    expect(routingKey).toBe(MEETING_UPDATED);
    expect(event.type).toBe('aether:ResourceUpdated');
    // The resource as it now stands, not the fields that moved: a consumer
    // holding a graph would otherwise have to reconstruct it from a base it
    // may never have seen.
    expect((event.data as Record<string, unknown>)['@id']).toBe(
      meetingIri('meeting-1'),
    );
  });

  it('still returns the meeting when the broker is down', async () => {
    const { service } = harness(
      jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    await expect(
      service.updateMeeting(actor, 'meeting-1', { title: 'Retro' }),
    ).resolves.toEqual(meeting);
  });
});

describe('delete', () => {
  it('publishes a resource-deleted event carrying no document', async () => {
    const { service, publish } = harness();

    await service.delete(actor, 'meeting-1');

    const { routingKey, event } = published(publish);

    expect(routingKey).toBe(MEETING_DELETED);
    expect(event.type).toBe('aether:ResourceDeleted');
    // The resource is gone; `subject` is all a consumer needs to drop what it
    // holds, and organon's schema refuses a delete that carries data.
    expect(event.data).toBeUndefined();
    expect(event.subject).toBe(meetingIri('meeting-1'));
  });

  it('still succeeds when the broker is down', async () => {
    const { service } = harness(
      jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    await expect(service.delete(actor, 'meeting-1')).resolves.toBeUndefined();
  });
});

/*
 * The events are only useful if they are the shape organon says they are, and
 * that library is where a consumer validates them. Asserting against the real
 * schema is what makes these tests about the contract rather than about the
 * object literal in the service.
 */
describe('every event satisfies organon’s schema', () => {
  it.each([
    [
      'created',
      (s: MeetingService) => s.create(actor, request as never),
    ],
    [
      'updated',
      (s: MeetingService) => s.updateMeeting(actor, 'meeting-1', {}),
    ],
    ['deleted', (s: MeetingService) => s.delete(actor, 'meeting-1')],
  ])('%s', async (_name, call) => {
    const { service, publish } = harness();

    await call(service);

    const result = aetherEventSchema.safeParse(published(publish).event);

    expect(result.success).toBe(true);
  });

  it('states the subject and the document’s @id identically', async () => {
    // organon refuses an event where they disagree: the same fact stated twice
    // is one a consumer would file under the wrong node.
    const { service, publish } = harness();

    await service.create(actor, request as never);

    const { event } = published(publish);

    expect(event.subject).toBe((event.data as Record<string, unknown>)['@id']);
  });
});

describe('who may be added to a meeting', () => {
  /* The create fixture above has no participants; these need one. */
  const withAda = { ...request, participants: [{ personId: 'person-1' }] };

  it('accepts someone prosopone still knows', async () => {
    const { service, publish, personRepository } = harness();

    await service.create(actor, withAda as never);

    expect(personRepository.find).toHaveBeenCalled();
    expect(publish).toHaveBeenCalled();
  });

  it('refuses someone prosopone has deleted', async () => {
    /*
     * `sourceUri` null means akouo can no longer name them. A participation
     * referencing such a person is dropped from the published document, so the
     * meeting would go out with the attendee silently missing — better to
     * refuse the request than to quietly lose them.
     */
    const { service, publish } = harness(undefined, [
      { id: 'person-1', name: 'Ada Lovelace', sourceUri: null },
    ]);

    await expect(service.create(actor, withAda as never)).rejects.toThrow(
      /no longer be added/,
    );
    // Nothing was saved, so nothing is announced.
    expect(publish).not.toHaveBeenCalled();
  });

  it('refuses someone akouo has never heard of', async () => {
    const { service } = harness(undefined, []);

    await expect(service.create(actor, withAda as never)).rejects.toThrow(
      /no longer be added/,
    );
  });

  it('names who could not be added, so the caller can fix it', async () => {
    const { service } = harness(undefined, [
      { id: 'person-1', name: 'Ada Lovelace', sourceUri: null },
    ]);

    await expect(service.create(actor, withAda as never)).rejects.toMatchObject(
      {
        response: {
          errors: [
            {
              path: 'participants',
              message: expect.stringContaining('Ada Lovelace'),
            },
          ],
        },
      },
    );
  });

  it('checks nobody when a meeting has no participants', async () => {
    // A query for an empty set is a query worth not making.
    const { service, personRepository } = harness();

    await service.create(actor, request as never);

    expect(personRepository.find).not.toHaveBeenCalled();
  });
});

describe('where a new meeting is', () => {
  const withLocation = {
    ...request,
    participants: [],
    locationId: 'a-real-location',
  };

  it('resolves the location the caller named', async () => {
    // Both dialogs send `locationId`: the scheduling modal and the upload
    // dialog, which creates a meeting before it attaches the recording.
    const { service, locations } = harness();

    locations.findById.mockResolvedValue({
      id: 'a-real-location',
      name: 'Het Sieraad',
      uri: 'urn:aether:place:pl1',
    });

    await service.create(actor, withLocation as never);

    expect(locations.findById).toHaveBeenCalledWith(
      actor.organizationId,
      'a-real-location',
    );
  });

  it('refuses an id this organization does not have', async () => {
    /*
     * A 400 rather than a silent null: the caller asked for somewhere
     * specific, and a meeting quietly filed as nowhere is worse than being
     * told the id was wrong. It is also the only thing standing between a
     * guessed id and another tenant's location.
     */
    const { service, publish } = harness();

    await expect(service.create(actor, withLocation as never)).rejects.toThrow(
      /does not exist in this organization/,
    );
    expect(publish).not.toHaveBeenCalled();
  });

  it('looks nothing up when no location was named', async () => {
    // Most meetings are nowhere — a call is not somewhere — so this must not
    // cost a query.
    const { service, locations } = harness();

    await service.create(actor, { ...request, participants: [] } as never);

    expect(locations.findById).not.toHaveBeenCalled();
  });
});
