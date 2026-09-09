import { z } from 'zod';

import { auditedSchema } from '../common';

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).describe('What this template is for'),
  description: z.string().trim().max(1000).nullable().optional(),
  content: z.string().trim().min(1).describe('The template body'),
});

/** Editing one: everything optional, and only what is sent changes. */
export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  content: z.string().trim().min(1).optional(),
});

export const templateSchema = auditedSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
  content: z.string(),
});

export type CreateTemplateDTO = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDTO = z.infer<typeof updateTemplateSchema>;
export type TemplateDTO = z.infer<typeof templateSchema>;
