import type { MeetingDTO } from '@akouo/contract';

import { meetingIri, toMeetingDocument } from './meeting.json-ld';

const participant = (over: Record<string, unknown> = {}) => ({
  id: 'participation-1',
  meetingId: 'meeting-1',
  personId: 'akouo-local-id',
  personUri: 'urn:aether:person:from-prosopone',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const meeting = (over: Record<string, unknown> = {}): MeetingDTO =>
  ({
    id: 'meeting-1',
    title: 'Standup',
    startDate: '2026-01-01T09:00:00Z',
    status: 'INITIAL',
    organizationId: 'org-1',
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [participant()],
    locationId: null,
    locationUri: null,
    ...over,
  }) as unknown as MeetingDTO;

describe('the meeting document', () => {
  it('is keyed by the meeting IRI', () => {
    expect(toMeetingDocument(meeting())['@id']).toBe(meetingIri('meeting-1'));
  });

  it('omits an endTime the meeting does not have', () => {
    // Absent means "not stated"; null would assert that it ends at no time.
    expect(toMeetingDocument(meeting())).not.toHaveProperty('endTime');
  });
});

describe('who a participation points at', () => {
  it('is the IRI the workspace knows the person by', () => {
    const [participation] = toMeetingDocument(meeting()).participations;

    expect(participation.participant).toEqual({
      '@id': 'urn:aether:person:from-prosopone',
    });
  });

  it('is never derived from akouo’s local row id', () => {
    /*
     * The bug this replaced: minting `urn:aether:person:{local id}` produced a
     * *second* node for the same human, so a meeting referenced a participant
     * that existed nowhere else — sitting beside the real person, whom nothing
     * linked to. akouo's id is an identifier for the same person, not the
     * name the workspace uses.
     */
    const document = toMeetingDocument(meeting());

    expect(JSON.stringify(document)).not.toContain('akouo-local-id');
  });

  it('carries akouo’s own namespace for someone prosopone never announced', () => {
    // People predating the event stream have no `sourceUri`. `personUri` gives
    // them `urn:akouo:person:{id}` — claiming `urn:aether:person:` for one
    // prosopone does not know would risk colliding with a real person's node.
    const [participation] = toMeetingDocument(
      meeting({
        participants: [participant({ personUri: 'urn:akouo:person:local-1' })],
      }),
    ).participations;

    expect(participation.participant).toEqual({
      '@id': 'urn:akouo:person:local-1',
    });
  });

  it('drops a participation whose person cannot be named', () => {
    // A participation says *someone* was there; one that cannot say who is not
    // worth a node in anybody's graph, and an empty reference would hide the
    // query bug that caused it.
    const document = toMeetingDocument(
      meeting({ participants: [participant({ personUri: null })] }),
    );

    expect(document.participations).toEqual([]);
  });

  it('keeps the ones it can name when another is unnameable', () => {
    const document = toMeetingDocument(
      meeting({
        participants: [
          participant({ id: 'p-1', personUri: null }),
          participant({ id: 'p-2', personUri: 'urn:aether:person:known' }),
        ],
      }),
    );

    expect(document.participations).toHaveLength(1);
    expect(document.participations[0]['@id']).toContain('p-2');
  });
});

describe('where a meeting is', () => {
  it('references the place IRI, not akouo’s row id', () => {
    /*
     * `urn:aether:place:…` is the node topos announced and arachni already
     * holds, so the meeting joins straight onto it. akouo's local id would
     * name a node nobody else has — the mistake `participant` used to make.
     */
    const document = toMeetingDocument(
      meeting({
        locationId: 'akouo-location-row',
        locationUri: 'urn:aether:place:pl1',
      }),
    );

    expect(document.location).toEqual({ '@id': 'urn:aether:place:pl1' });
    expect(JSON.stringify(document)).not.toContain('akouo-location-row');
  });

  it('says nothing when the meeting has no location', () => {
    // Absent means "not stated"; a null reference would assert it is nowhere.
    const document = toMeetingDocument(
      meeting({ locationId: null, locationUri: null }),
    );

    expect(document).not.toHaveProperty('location');
  });

  it('says nothing when the place behind it was deleted', () => {
    // An unlinked location has no IRI to give, and inventing one would claim
    // a place that is gone.
    const document = toMeetingDocument(
      meeting({ locationId: 'akouo-location-row', locationUri: null }),
    );

    expect(document).not.toHaveProperty('location');
  });
});
