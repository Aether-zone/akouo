import { z } from 'zod';

/**
 * Where a transcription's or an utterance's words came from.
 *
 * `TRANSCRIBED` is everything a transcriber produced and nobody has touched since.
 * `MANUAL` is what a person corrected through the API — the marker exists so a
 * later transcription run, or a reader deciding what to trust, can tell a machine's
 * guess from a human's correction.
 *
 * Named `origin` rather than `type` on the entities: `type` says nothing about what
 * it holds, and reads badly next to TypeScript's own `type`.
 */
export const CONTENT_ORIGINS = ['TRANSCRIBED', 'MANUAL'] as const;

export const contentOriginSchema = z.enum(CONTENT_ORIGINS);

export type ContentOrigin = (typeof CONTENT_ORIGINS)[number];
