import { z } from 'zod';
import { baseSchema } from './base';

export const auditedSchema = baseSchema.extend({
  /**
   * The organization the row belongs to — the tenant boundary. Every query for
   * an audited row filters on it, and it comes from the request path, checked
   * against the caller's memberships by `OrganizationGuard`.
   */
  organizationId: z.uuid(),
  /** Who created the row, as a pistis subject. Provenance, not a filter. */
  createdBy: z.uuid().nullable(),
});

export type AuditedDTO = z.infer<typeof auditedSchema>;
