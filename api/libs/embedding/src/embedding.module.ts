import { Module } from '@nestjs/common';

import { EmbeddingService } from './embedding.service';
import { VECTOR_STORE } from './vector-store';
import { FileVectorStore } from './file/file.vector-store';
import { EmbeddingListener } from './embedding.listener';

/**
 * Embeddings have no routes of their own: they are written by whatever produces
 * them and read by whatever searches, both inside the application.
 */
@Module({
  providers: [
    EmbeddingService,
    EmbeddingListener,
    /*
     * The one place a store is chosen. The file store keeps vectors in a JSON
     * file, which is enough to develop and test against — swapping it for the
     * pgvector one is this line.
     */
    { provide: VECTOR_STORE, useClass: FileVectorStore },
  ],
  exports: [EmbeddingService, VECTOR_STORE],
})
export class EmbeddingModule { }
