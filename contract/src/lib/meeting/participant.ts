import { z } from 'zod';

import { baseSchema } from '../common';

export const createParticipantSchema = z.object({
  personId: z.uuid(),
});

export const participantSchema = baseSchema.extend({
  meetingId: z.uuid(),
  personId: z.uuid(),
});

export type CreateParticipantDTO = z.infer<typeof createParticipantSchema>;
export type ParticipantDTO = z.infer<typeof participantSchema>;
