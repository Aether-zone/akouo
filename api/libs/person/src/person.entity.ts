/*
 * The specific module, not the `@akouo/common` barrel. That barrel re-exports
 * the file and loculus modules too, which reach back here — so importing it
 * from an entity forms a cycle, and under jest the class is still undefined
 * when a spec calls `new Person()`. Participant already imports Person by its
 * exact path for the same reason.
 */
import { AuditedEntity } from '@akouo/common/database/audited-entity';
import { Entity, Column, Index } from 'typeorm';

/**
 * Someone akouo knows about.
 *
 * People are not created through akouo's api any more: they arrive as
 * `aether:ResourceCreated` events from prosopone, and {@link sourceUri} is
 * what makes that safe to receive twice.
 */
@Index(['organizationId', 'sourceUri'], {
  unique: true,
  // Only rows that came from an event participate. A partial index rather than
  // a plain unique one, because every locally-created person has a null here
  // and SQLite would otherwise allow only one of them per organization.
  where: '"source_uri" IS NOT NULL',
})
@Entity()
export class Person extends AuditedEntity {
  @Column({ length: 500 })
  name: string;

  /**
   * The IRI of the resource this person was projected from —
   * `urn:aether:person:{id}` in prosopone.
   *
   * The whole point is idempotency. The broker offers at-least-once delivery,
   * so the same `person.created` can arrive twice, and without a key from the
   * event there is nothing to recognise the second one by: akouo would file a
   * second "Ada Lovelace" and nothing could tell them apart afterwards. Name
   * is not that key — two real people share one.
   *
   * Null for anyone who predates the event stream. Nullable rather than
   * defaulted to the local id, because "came from nowhere" and "came from
   * itself" are different claims.
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'source_uri' })
  sourceUri: string | null;
}
