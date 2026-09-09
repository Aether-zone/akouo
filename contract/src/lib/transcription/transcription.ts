import { auditedSchema } from '../common';
import { z } from 'zod';

import { createUtteranceSchema, utteranceSchema } from './utterance';
import { contentOriginSchema } from './content-origin';

export const createTranscriptionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .describe('The transcribed text of the recording'),
  /*
   * Optional, so a caller can post plain text: a transcriber that diarizes sends
   * the turns as well, one that does not sends only `content`.
   */
  utterances: z
    .array(createUtteranceSchema)
    .default([])
    .describe('The transcript split into turns, in the order they were spoken'),
});

/**
 * Editing a transcription is correcting what a transcriber heard, so `content` is
 * all there is to change — the recording it belongs to and who made it do not move.
 */
export const updateTranscriptionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .describe('The corrected text of the recording'),
});

export const transcriptionSchema = auditedSchema.extend({
  content: z.string(),
  recordingId: z.string(),
  /** Set by the server: `TRANSCRIBED` on creation, `MANUAL` once edited. */
  origin: contentOriginSchema,
  utterances: z.array(utteranceSchema),
});

export type CreateTranscriptionDTO = z.infer<typeof createTranscriptionSchema>;
export type UpdateTranscriptionDTO = z.infer<typeof updateTranscriptionSchema>;
export type TranscriptionDTO = z.infer<typeof transcriptionSchema>;
