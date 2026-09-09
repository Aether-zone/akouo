import { z } from 'zod';

import { auditedSchema } from '../common';

import { embeddingSourceSchema } from './embedding-source';

export const createEmbeddingSchema = z.object({
  sourceType: embeddingSourceSchema.describe('What the vector was made from'),
  sourceId: z.uuid().describe('Id of the row that text belongs to'),
  content: z.string().trim().min(1).describe('The text that was embedded'),
  vector: z
    .array(z.number())
    .min(1)
    .describe('The embedding itself, in the order the model returned it'),
});

export const embeddingSchema = auditedSchema.extend({
  sourceType: embeddingSourceSchema,
  sourceId: z.uuid(),
  content: z.string(),
  vector: z.array(z.number()),
});

export type CreateEmbeddingDTO = z.infer<typeof createEmbeddingSchema>;
export type EmbeddingDTO = z.infer<typeof embeddingSchema>;
