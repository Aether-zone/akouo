import { AuditedEntity } from '@akouo/common/database/audited-entity';
import { Column, Entity, Index } from 'typeorm';

/**
 * Somewhere a meeting can be, as announced by topos.
 *
 * akouo does not own these. A location exists here because aether said a place
 * exists there, and every field is a copy — this table is a projection, not a
 * source. Nothing in akouo creates one through an api.
 */
@Index(['organizationId', 'uri'], {
  unique: true,
  // Only rows still linked to a place participate; an unlinked location has a
  // null here, and SQLite would otherwise allow only one of them per
  // organization.
  where: '"uri" IS NOT NULL',
})
@Entity()
export class Location extends AuditedEntity {
  @Column({ length: 500 })
  name: string;

  /**
   * The IRI of the place this was projected from — `urn:aether:place:{id}`.
   *
   * The key, not a label. The broker delivers at least once, so the same
   * `place.created` can arrive twice; without a key from the event there is
   * nothing to recognise the second one by, and akouo would file a second
   * "Het Sieraad". Name will not do — two rooms may share one.
   *
   * Null once topos has deleted that place. The row stays — a meeting that
   * happened somewhere should keep saying where — and what goes is the claim
   * that aether still knows the place. Exactly the trade
   * `PersonService.unlinkFromSource` makes, and for the same reason: this
   * became referenceable the moment a meeting could point at it.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  uri: string | null;
}
