import type { MeetingDTO } from '@akouo/contract';
import type { JsonLdDocument, JsonLdReference } from '@aether-zone/organon';

/**
 * A meeting as the rest of aether-zone sees it.
 *
 * Not `MeetingDTO`. That one is akouo's HTTP shape — audit columns, an
 * `organizationId`, a status enum only akouo acts on — and putting it on the
 * bus would make every consumer depend on akouo's api. This is the resource
 * described in a vocabulary anything can read, keyed by an IRI rather than a
 * bare uuid, which is what lets a graph store relate it to a person or a
 * recording without knowing where either came from.
 */

/** The vocabulary aether-zone publishes under. */
export const AETHER_VOCAB = 'https://aether.zone/vocab/';

/**
 * The context every meeting document carries.
 *
 * Inline rather than a URL: a remote context has to be fetched before a
 * document can be read, which turns every consumer into an HTTP client and
 * this service into their dependency.
 */
export const MEETING_CONTEXT = {
  aether: AETHER_VOCAB,
  participant: 'aether:participant',
  recording: 'aether:recording',
  location: 'aether:location',
} as const;

export interface MeetingJsonLD extends JsonLdDocument {
  '@type': 'aether:Meeting';
  '@context': typeof MEETING_CONTEXT;

  title: string;
  startTime: string;
  endTime?: string;

  participations: ParticipationJsonLD[];

  recording?: JsonLdReference;

  /**
   * Where it is, as the *place's* IRI rather than akouo's row id.
   *
   * `urn:aether:place:…` is the node topos announced and arachni already
   * holds, so a meeting published with this reference joins straight onto it.
   * Sending akouo's local id would name a node nobody else has — the same
   * mistake `participant` used to make.
   *
   * Absent when the meeting has no location, or when it has one whose place
   * topos has since deleted: an unlinked location has no IRI to give, and
   * inventing one would claim a place that is gone.
   */
  location?: JsonLdReference;
}

/**
 * Someone's presence in a meeting, as a resource of its own.
 *
 * A node rather than a plain reference to the person, because the relationship
 * carries facts — when they joined, what role they had — that belong to
 * neither end of it.
 */
export interface ParticipationJsonLD extends JsonLdDocument {
  '@type': 'aether:Participation';
  '@context': typeof MEETING_CONTEXT;

  participant: JsonLdReference;

  role?: string;
  joinedAt?: string;
  leftAt?: string;
}

/**
 * The IRI a meeting is known by outside akouo.
 *
 * A URN rather than a URL: it names the resource without promising that
 * anything will answer if you fetch it, which is the honest claim for an id
 * that travels on a bus. Every event about a meeting states this, and a
 * consumer's graph keys on it.
 */
export const meetingIri = (id: string): string => `urn:aether:meeting:${id}`;

/*
 * There is deliberately no `personIri(id)` here any more.
 *
 * It used to mint `urn:aether:person:{akouo local id}`, which was wrong the
 * moment prosopone started announcing people: the person's IRI is the one the
 * event carried, and deriving another from akouo's own row id produced a
 * *second* node for the same human — so a meeting referenced a participant
 * that existed nowhere else, sitting beside the real person nothing linked to.
 *
 * The IRI now travels on `ParticipantDTO.personUri`, decided once in
 * `@akouo/person`'s `personUri`, which knows whether the person came from
 * prosopone or predates the stream. A function here taking an id could not
 * know that, which is why it is gone rather than fixed.
 */

/** The IRI for one person's presence in one meeting. */
export const participationIri = (id: string): string =>
  `urn:aether:participation:${id}`;

/**
 * A meeting DTO as a JSON-LD document.
 *
 * `endTime` is omitted rather than sent as null when a meeting has no end:
 * absent means "not stated", where null would assert that it ends at no time.
 */
export function toMeetingDocument(meeting: MeetingDTO): MeetingJsonLD {
  return {
    '@context': MEETING_CONTEXT,
    '@id': meetingIri(meeting.id),
    '@type': 'aether:Meeting',
    title: meeting.title,
    startTime: meeting.startDate,
    ...(meeting.locationUri ? { location: { '@id': meeting.locationUri } } : {}),
    ...(meeting.endDate ? { endTime: meeting.endDate } : {}),
    /*
     * Participations without a resolvable person are dropped rather than
     * published with a missing reference: a participation is a statement that
     * *someone* was there, and one that cannot say who is not worth a node in
     * anybody's graph. In practice this only happens when the relation was not
     * loaded, which is a query bug — and a silently empty participant would
     * hide it.
     */
    participations: meeting.participants
      .filter((participant) => participant.personUri)
      .map((participant) => ({
        '@context': MEETING_CONTEXT,
        '@id': participationIri(participant.id),
        '@type': 'aether:Participation' as const,
        participant: { '@id': participant.personUri! },
      })),
  };
}
