import type { EmbeddingSource } from '@akouo/contract';
import type { Actor } from '@aether-zone/organon';

/**
 * Emitted when something has text worth embedding.
 *
 * The point of an event rather than a call: whatever produces the text — a
 * transcription, a meeting summary — should not have to know whether embedding
 * happens at all, let alone which store or model does it.
 */
export const EMBEDDING_EVENT = 'embedding.requested';

export class EmbeddingEvent {
    constructor(
        /** What the text belongs to, so a match can be traced back to it. */
        public readonly sourceType: EmbeddingSource,
        public readonly sourceId: string,
        /** The text to embed. */
        public readonly content: string,
        public readonly user: Actor
    ) { }
}
