/**
 * Routing keys akouo publishes under.
 *
 * Named constants rather than string literals at each call site, because a
 * publisher and a subscriber that disagree about a key fail silently: the
 * message goes to the exchange, matches nothing, and is dropped. Nothing errors
 * and nothing arrives.
 */
export const MEETING_CREATED = 'meeting.created';
export const MEETING_UPDATED = 'meeting.updated';
export const MEETING_DELETED = 'meeting.deleted';

/**
 * What akouo puts in an event's `source`.
 *
 * An IRI rather than the bare name, because `source` identifies the producer
 * across the whole workspace and a bare word is only unique by luck.
 */
export const AETHER_SOURCE = 'https://aether.zone/akouo';

/*
 * The body of a meeting event is organon's `AetherEvent<Meeting>`, where
 * `Meeting` is the JSON-LD document in `meeting.json-ld.ts` — not `MeetingDTO`.
 *
 * That is deliberate. `MeetingDTO` is akouo's HTTP shape: audit columns, an
 * `organizationId`, a status enum only akouo acts on. Putting it on the bus
 * would make every consumer depend on akouo's api and on its idea of what a
 * meeting is. The JSON-LD document says the same things in a vocabulary
 * anything can read, keyed by an IRI a graph store can relate to a person or a
 * recording without knowing where either came from.
 *
 * The envelope — `id`, `time`, `source`, `subject`, `actor` — is the Aether
 * event's own, and organon's `aetherEventSchema` is what validates it.
 */
