import { z } from 'zod';

import { baseSchema } from '../common';

export const createParticipantSchema = z.object({
  personId: z.uuid(),
});

export const participantSchema = baseSchema.extend({
  meetingId: z.uuid(),
  /** akouo's own row id for the person — what its relations and its web app use. */
  personId: z.uuid(),
  /**
   * The IRI the *workspace* knows that person by, which is what a published
   * meeting document references.
   *
   * Not derivable from `personId`: a person announced by prosopone is known by
   * the IRI in the event, and akouo's local id is a different identifier for
   * the same human. Null only when the relation was not loaded.
   */
  personUri: z.string().min(1).nullable(),
});

export type CreateParticipantDTO = z.infer<typeof createParticipantSchema>;
export type ParticipantDTO = z.infer<typeof participantSchema>;
