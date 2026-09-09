import { z } from 'zod';

export const baseSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseDTO = z.infer<typeof baseSchema>;
