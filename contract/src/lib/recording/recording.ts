import { z } from 'zod';

import { auditedSchema, fileSchema } from '../common';

export const createRecordingSchema = z.object({
  fileId: z
    .uuid()
    .describe('Id of an already stored file to attach as the recording'),
});

export const recordingSchema = auditedSchema.extend({
  file: fileSchema,
  meetingId: z.uuid(),
});

export type CreateRecordingDTO = z.infer<typeof createRecordingSchema>;
export type RecordingDTO = z.infer<typeof recordingSchema>;
