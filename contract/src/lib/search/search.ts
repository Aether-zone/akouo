import { z } from 'zod';

import { embeddingSourceSchema } from '../embedding';

/** Query string of a search request. */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).describe('What to search for, in plain words'),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sourceType: embeddingSourceSchema
    .optional()
    .describe('Only match this kind of thing — a turn, a transcript'),
});

export const searchResultSchema = z.object({
  sourceType: embeddingSourceSchema,
  /** Id of the utterance or transcription the text belongs to. */
  sourceId: z.string(),
  content: z.string(),
  /** How close it is to the query, 0..1 — higher is nearer. */
  score: z.number(),
});

export type SearchQueryDTO = z.infer<typeof searchQuerySchema>;
export type SearchResultDTO = z.infer<typeof searchResultSchema>;
