import { z } from 'zod';

import { baseSchema } from '../common';
import { participantSchema } from '../meeting';

import { contentOriginSchema } from './content-origin';

export const createUtteranceSchema = z.object({
  speakerLabel: z
    .string()
    .trim()
    .min(1)
    .describe('Label diarization gave the voice, e.g. "A"'),
  /*
   * By id on the way in — a participant is attached to an utterance, never created
   * through one. The whole participant comes back on the way out.
   */
  participantId: z
    .uuid()
    .nullable()
    .optional()
    .describe('Meeting participant behind the label, when it is known'),
  content: z.string().trim().min(1).describe('What was said in this turn'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How sure the transcriber is of these words'),
  start: z
    .number()
    .int()
    .nonnegative()
    .describe(
      'Offset into the recording where the turn starts, in milliseconds',
    ),
  end: z
    .number()
    .int()
    .nonnegative()
    .describe('Offset where the turn ends, in milliseconds'),
});

/**
 * Correcting one turn: its words, who diarization thought was speaking, or the
 * participant it belongs to. Everything is optional, and only what is sent changes.
 * The timings are not editable — they describe the audio, which has not moved.
 */
export const updateUtteranceSchema = z
  .object({
    speakerLabel: z.string().trim().min(1).optional(),
    participantId: z.uuid().nullable().optional(),
    content: z.string().trim().min(1).optional(),
  })
  .refine((utterance) => Object.keys(utterance).length > 0, {
    message: 'Nothing to update',
  });

export const utteranceSchema = baseSchema.extend({
  transcriptionId: z.uuid(),
  speakerLabel: z.string(),
  /** Null while the speaker label has not been matched to anyone. */
  participant: participantSchema.nullable(),
  content: z.string(),
  confidence: z.number(),
  start: z.number(),
  end: z.number(),
  /** Set by the server: `TRANSCRIBED` on creation, `MANUAL` once edited. */
  origin: contentOriginSchema,
});

export type CreateUtteranceDTO = z.infer<typeof createUtteranceSchema>;
export type UpdateUtteranceDTO = z.infer<typeof updateUtteranceSchema>;
export type UtteranceDTO = z.infer<typeof utteranceSchema>;
