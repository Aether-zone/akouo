import type { Person } from './person.entity';

/**
 * The IRI the workspace knows a person by.
 *
 * **`sourceUri` when there is one.** People arrive from prosopone as
 * `aether:ResourceCreated` events carrying `urn:aether:person:{prosopone id}`,
 * and that is the node every other service has already related things to.
 * Minting a fresh IRI from akouo's *local* row id instead would point at a
 * different node with the same shape — the meeting would reference a person
 * who exists nowhere else, beside the real one nothing links to.
 *
 * **`urn:akouo:person:{id}` when there is not.** akouo still holds people who
 * predate the event stream, and after prosopone took ownership of
 * `urn:aether:person:` this service has no authority to mint in that
 * namespace: doing so would claim a person prosopone never announced, and two
 * such claims could collide on one node. Its own namespace says plainly that
 * this person is akouo's and unreconciled.
 */
export const personUri = (
  person: Pick<Person, 'id' | 'sourceUri'>,
): string => person.sourceUri ?? `urn:akouo:person:${person.id}`;
