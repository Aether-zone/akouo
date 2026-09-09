import { z } from 'zod';

/**
 * Which transcription to apply a template version to.
 *
 * Transcriptions are addressed under a meeting and a recording, so all three ids
 * are needed to find one — and looking it up that way is what checks the caller
 * is allowed to read it.
 */
export const applyTemplateSchema = z.object({
  meetingId: z.uuid(),
  recordingId: z.uuid(),
  transcriptionId: z.uuid(),
});

export const appliedTemplateSchema = z.object({
  templateVersionId: z.uuid(),
  transcriptionId: z.uuid(),
  /**
   * What the version produced, in the shape its body describes. Unknown here on
   * purpose: the schema lives on the version, so only its author knows the type.
   */
  output: z.unknown(),
});

export type ApplyTemplateDTO = z.infer<typeof applyTemplateSchema>;
export type AppliedTemplateDTO = z.infer<typeof appliedTemplateSchema>;
