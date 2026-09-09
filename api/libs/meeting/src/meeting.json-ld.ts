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
} as const;

export interface MeetingJsonLD extends JsonLdDocument {
  '@type': 'aether:Meeting';
  '@context': typeof MEETING_CONTEXT;

  title: string;
  startTime: string;
  endTime?: string;

  participations: ParticipationJsonLD[];

  recording?: JsonLdReference;
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

/** The IRI for a person, minted by the same rule. */
export const personIri = (id: string): string => `urn:aether:person:${id}`;

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
    ...(meeting.endDate ? { endTime: meeting.endDate } : {}),
    participations: meeting.participants.map((participant) => ({
      '@context': MEETING_CONTEXT,
      '@id': participationIri(participant.id),
      '@type': 'aether:Participation' as const,
      participant: { '@id': personIri(participant.personId) },
    })),
  };
}
