import { z } from 'zod';

/**
 * Where a version stands: `DRAFT` while it is only kept, `PUBLISHED` once it is
 * the one meant to be used.
 *
 * A template has at most one published version — publishing one puts the
 * previous back to `DRAFT`, so "published" always names a single wording.
 */
export const TEMPLATE_VERSION_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export const templateVersionStatusSchema = z.enum(TEMPLATE_VERSION_STATUSES);

export type Status = (typeof TEMPLATE_VERSION_STATUSES)[number];
