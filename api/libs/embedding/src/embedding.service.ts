import { CreateEmbeddingDTO, EmbeddingDTO } from '@akouo/contract';
import { Inject, Injectable } from '@nestjs/common';

import type { Actor } from '@aether-zone/organon';

import {
  VECTOR_STORE,
  type VectorSearchOptions,
  type VectorStore,
} from './vector-store';
import { AIProvider } from '@akouo/ai';

@Injectable()
export class EmbeddingService {

  constructor(
    @Inject(VECTOR_STORE) private readonly vectorStore: VectorStore,
    private readonly aiProvider: AIProvider
  ) { }

  async create(
    user: Actor,
    embedding: CreateEmbeddingDTO,
  ): Promise<void> {
    this.vectorStore.insert(embedding, user)
  }

  /**
   * What the caller has stored that is closest in meaning to a question, nearest
   * first.
   *
   * Takes text rather than a vector: the query has to be embedded by the same
   * model that embedded what is stored, or the distances mean nothing, and this
   * is the only place that knows which model that is.
   *
   * Only the caller's own embeddings are considered — the store filters on the
   * owner, the same as every other read in the application.
   */
  async search(
    user: Actor,
    query: string,
    options?: VectorSearchOptions,
  ): Promise<(EmbeddingDTO & { score: number })[]> {
    const vector = await this.aiProvider.embed(query);

    return this.vectorStore.search(vector, user, options);
  }

}
