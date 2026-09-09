import { z } from 'zod';

import { auditedSchema } from '../common';

import { templateVersionStatusSchema } from './template-version-status';

/**
 * Taking a snapshot. With no `content` the template's own is stored, which is
 * the usual case — a version is normally "what it says right now".
 */
export const createTemplateVersionSchema = z.object({
  content: z.string().trim().min(1).optional(),
  /** The instruction this wording goes with, when there is one. */
  prompt: z.string().trim().min(1).nullable().optional(),
});

export const templateVersionSchema = auditedSchema.extend({
  templateId: z.uuid(),
  version: z.number().int().positive(),
  content: z.string(),
  prompt: z.string().nullable(),
  status: templateVersionStatusSchema,
});

export type CreateTemplateVersionDTO = z.infer<
  typeof createTemplateVersionSchema
>;
export type TemplateVersionDTO = z.infer<typeof templateVersionSchema>;
