import { Column, Index } from 'typeorm';
import { BaseEntity } from './base-entity';

/**
 * A row that belongs to an organization and remembers who made it.
 *
 * `organizationId` is the tenant boundary: every query for these rows filters on
 * it, and it comes from the request path, checked against the caller's `orgs`
 * claim by `OrganizationGuard`. `createdBy` is provenance only — it records the
 * pistis subject who created the row and is deliberately *not* what reads are
 * filtered by, because a member of an organization can see the organization's
 * work, not only their own.
 *
 * Rows extending `BaseEntity` instead (participants, utterances) are reached
 * only through a parent that carries the organization, so they inherit the
 * boundary rather than repeating it.
 */
export abstract class AuditedEntity extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;
}
