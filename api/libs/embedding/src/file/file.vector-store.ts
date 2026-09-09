import { CreateEmbeddingDTO, EmbeddingDTO, EmbeddingSource } from '@akouo/contract';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import type { Actor } from '@aether-zone/organon';

import { VectorSearchOptions, VectorStore } from '../vector-store';

/** Where the vectors live when nothing says otherwise. */
const DEFAULT_PATH = 'embeddings.json';

/**
 * A {@link VectorStore} kept in a JSON file, for testing and for running without
 * a database.
 *
 * Everything is held in memory and the whole file is rewritten on each insert,
 * which is fine for a few thousand vectors and hopeless beyond that — the real
 * store is pgvector. Search is exact rather than approximate for the same
 * reason: with everything in memory there is no index to be clever with, and
 * comparing every vector is both simpler and more accurate.
 */
@Injectable()
export class FileVectorStore implements VectorStore, OnModuleInit {
    private readonly logger = new Logger(FileVectorStore.name);

    private embeddings: EmbeddingDTO[] = [];

    /**
     * Writes are queued behind one another. A transcription announces every turn
     * at once, so several inserts land together, and each one rewrites the whole
     * file — overlapping them would interleave and truncate it.
     */
    private writing: Promise<void> = Promise.resolve();

    constructor() { }

    async onModuleInit(): Promise<void> {
        this.embeddings = await this.load();

        this.logger.log(
            `Loaded ${this.embeddings.length} embeddings from ${this.path}`,
        );
    }

    async insert(
        embedding: CreateEmbeddingDTO,
        user: Actor,
    ): Promise<void> {
        const now = new Date();

        this.embeddings.push({
            id: randomUUID(),
            sourceType: embedding.sourceType,
            sourceId: embedding.sourceId,
            content: embedding.content,
            vector: embedding.vector,
            createdAt: now,
            updatedAt: now,
            organizationId: user.organizationId,
            createdBy: user.id,
        });

        await this.persist();
    }

    search(
        vector: number[],
        user: Actor,
        options?: VectorSearchOptions,
    ): Promise<(EmbeddingDTO & { score: number })[]> {
        const limit = options?.limit || 10;
        const minimumScore = options?.minimumScore ?? 0;


        const results = this.embeddings
            // Apply metadata filter first
            .filter((item) => this.matchesFilter(item, user, options?.sourceType))
            // Calculate similarity
            .map((item: EmbeddingDTO) => ({
                ...item,
                score: this.cosineSimilarity(vector, item.vector),
            }))
            .filter((item) => item.score >= minimumScore)
            // Highest similarity first
            .sort((a, b) => b.score - a.score)
            // Top K
            .slice(0, limit);

        return Promise.resolve(results);
    }

    /** Absolute, so the file does not move with the working directory. */
    private get path(): string {
        return resolve(process.cwd(), DEFAULT_PATH);
    }

    /**
     * Reads what is on disk. A missing file is the normal first run; anything
     * unreadable starts empty rather than failing the boot, since losing a test
     * store is not worth taking the application down for.
     */
    private async load(): Promise<EmbeddingDTO[]> {
        let contents: string;

        try {
            contents = await readFile(this.path, 'utf8');
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                this.logger.warn(
                    `Could not read ${this.path}, starting empty: ${String(error)}`,
                );
            }

            return [];
        }

        try {
            const stored = JSON.parse(contents) as EmbeddingDTO[];

            // JSON has no dates; they come back as strings and are revived here so
            // a loaded embedding matches one that was just inserted.
            return stored.map((embedding) => ({
                ...embedding,
                createdAt: new Date(embedding.createdAt),
                updatedAt: new Date(embedding.updatedAt),
            }));
        } catch (error) {
            this.logger.warn(
                `${this.path} is not valid JSON, starting empty: ${String(error)}`,
            );

            return [];
        }
    }

    private persist(): Promise<void> {
        this.writing = this.writing
            .then(() =>
                writeFile(
                    this.path,
                    `${JSON.stringify(this.embeddings, null, 2)}\n`,
                    'utf8',
                ),
            )
            .catch((error: unknown) => {
                // The vectors are still in memory, so a failed write costs the
                // next boot rather than this one.
                this.logger.error(`Could not write ${this.path}`, error);
            });

        return this.writing;
    }

    private matchesFilter(
        item: EmbeddingDTO,
        user: Actor,
        sourceType?: EmbeddingSource,
    ): boolean {
        if (item.createdBy !== user.id) {
            return false;
        }

        if (!sourceType) {
            return true;
        }

        return sourceType === item.sourceType;
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error(
                `Vector dimensions don't match: ${a.length} !== ${b.length}`,
            );
        }

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }
}
