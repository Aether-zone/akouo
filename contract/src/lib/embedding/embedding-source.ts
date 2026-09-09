import { z } from 'zod';

/**
 * What a vector was made from. Kept as a name-and-id pair rather than a relation:
 * anything in the application can be embedded, and a foreign key per kind would
 * point this library at every other one.
 */
export const EMBEDDING_SOURCES = ['TRANSCRIPTION', 'UTTERANCE'] as const;

export const embeddingSourceSchema = z.enum(EMBEDDING_SOURCES);

export type EmbeddingSource = (typeof EMBEDDING_SOURCES)[number];
