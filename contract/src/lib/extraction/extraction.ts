import { z } from 'zod';

import { auditedSchema } from '../common';

export const createExtractionSchema = z.object({
  templateVersionId: z.uuid().describe('The version that produced this'),
  transcriptionId: z.uuid().describe('The transcription it was run over'),
  output: z
    .unknown()
    .describe('The result, in the shape the version’s schema described'),
});

export const extractionSchema = auditedSchema.extend({
  templateVersionId: z.uuid(),
  transcriptionId: z.uuid(),
  output: z.unknown(),
});

export type CreateExtractionDTO = z.infer<typeof createExtractionSchema>;
export type ExtractionDTO = z.infer<typeof extractionSchema>;
