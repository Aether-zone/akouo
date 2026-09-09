import { CreateEmbeddingDTO, EmbeddingDTO } from '@akouo/contract';
import type { EmbeddingSource } from '@akouo/contract';
import type { Actor } from '@aether-zone/organon';

/**
 * DI token for {@link VectorStore}. An interface has no runtime value to inject
 * against, so implementations are registered under this instead.
 */
export const VECTOR_STORE = 'VECTOR_STORE';

export interface VectorSearchOptions {
    /** How many matches to return at most. */
    limit?: number;
    /** Only match vectors made from this kind of thing. */
    sourceType?: EmbeddingSource;
    /** Drop anything less similar than this, 0..1. */
    minimumScore?: number;
}

/**
 * Somewhere vectors are made and kept.
 *
 * The interface exists so the rest of the application can embed and search
 * without knowing which store is behind it — pgvector today, something else
 * later.
 */
export interface VectorStore {
    /**
     * The vector for a piece of text, from whichever embedding model the store is
     * configured with.
     *
     * Vectors only compare within the model that produced them, so a store must
     * embed and search through the same one.
     */
    insert(embedding: CreateEmbeddingDTO, user: Actor): Promise<void>;

    /**
     * The stored vectors closest to a query, nearest first.
     *
     * Takes text rather than a vector: the store owns the model, so it is the only
     * thing that can embed a query the same way it embedded what it holds.
     */
    search(
        vector: number[],
        user: Actor,
        options?: VectorSearchOptions,
    ): Promise<(EmbeddingDTO & { score: number })[]>;
}
