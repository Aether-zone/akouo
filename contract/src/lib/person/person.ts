import { auditedSchema } from '../common';
import { z } from 'zod';

export const createPersonSchema = z.object({
  name: z.string().trim().min(1).max(500).describe('Name of the person'),
});

export const personSchema = auditedSchema.extend({
  name: z.string(),
});

export type CreatePersonDTO = z.infer<typeof createPersonSchema>;
export type PersonDTO = z.infer<typeof personSchema>;
