import { z } from 'zod';

import { auditedSchema } from './audited';

export const fileSchema = auditedSchema.extend({
  /** Object key within the bucket. Exposed so a client can correlate log entries. */
  key: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  version: z.string(),
  status: z.string(),
});

export type FileDTO = z.infer<typeof fileSchema>;
