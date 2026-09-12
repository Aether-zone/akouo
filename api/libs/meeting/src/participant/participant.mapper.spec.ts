import type { Person } from '@akouo/person/person.entity';

import type { Participant } from './participant.entity';
import { ParticipantMapper } from './participant.mapper';

const mapper = new ParticipantMapper();

/*
 * Plain objects rather than real entities: the mapper reads two fields, and
 * constructing a TypeORM entity would drag its decorators and their metadata
 * into a test about neither.
 */
const participantWith = (person?: Partial<Person>): Participant =>
  ({
    id: 'participation-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(person ? { person } : {}),
  }) as unknown as Participant;

describe('the person a participant points at', () => {
  it('is named by the IRI prosopone announced', () => {
    // `sourceUri` is the node every other service has already related things
    // to. akouo's own row id is a different identifier for the same human.
    const dto = mapper.toDTO(
      participantWith({
        id: 'akouo-local-id',
        sourceUri: 'urn:aether:person:from-prosopone',
      }),
      'meeting-1',
    );

    expect(dto.personUri).toBe('urn:aether:person:from-prosopone');
    // The local id is still there — akouo's relations and its web app use it.
    expect(dto.personId).toBe('akouo-local-id');
  });

  it('falls back to akouo’s own namespace for someone prosopone never sent', () => {
    /*
     * People predating the event stream have no `sourceUri`. Minting
     * `urn:aether:person:{local id}` for them would claim prosopone's
     * namespace for a person it has never heard of, and could collide with a
     * real person's node; `urn:akouo:` says plainly whose this is.
     */
    const dto = mapper.toDTO(
      participantWith({ id: 'local-1', sourceUri: null }),
      'meeting-1',
    );

    expect(dto.personUri).toBe('urn:akouo:person:local-1');
  });

  it('is null when the relation was not loaded', () => {
    // A query bug rather than a state. Null so the document can drop the
    // participation instead of publishing a reference to nothing.
    const dto = mapper.toDTO(participantWith(), 'meeting-1');

    expect(dto.personUri).toBeNull();
    expect(dto.personId).toBe('');
  });
});
