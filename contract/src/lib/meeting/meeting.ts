import { z } from 'zod';

import { IsoDateTime, auditedSchema, fromIsoDateTime } from '../common';

import { createParticipantSchema, participantSchema } from './participant';
import { meetingStatusSchema } from './meeting-status';

export const createMeetingSchema = z
  .object({
    title: z.string().trim().min(1).max(500).describe('Title of the meeting'),
    startDate: IsoDateTime.describe('When the meeting starts, in UTC'),
    endDate: IsoDateTime.describe('When the meeting ends, in UTC').optional(),
    participants: z.array(createParticipantSchema),
  })
  .refine(
    (meeting) =>
      !meeting.endDate ||
      fromIsoDateTime(meeting.endDate) > fromIsoDateTime(meeting.startDate),
    { path: ['endDate'], message: 'endDate must be after startDate' },
  );

/**
 * Changing a meeting after the fact: everything is optional, and only what is
 * sent moves. Participants are their own rows and are not edited through here.
 */
export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  startDate: IsoDateTime.optional(),
  endDate: IsoDateTime.nullable().optional(),
  status: meetingStatusSchema.optional(),
  /** The whole set, when sent: whoever is missing from it is taken off. */
  participants: z.array(createParticipantSchema).optional(),
});

export const meetingSchema = auditedSchema.extend({
  title: z.string(),
  startDate: IsoDateTime,
  endDate: IsoDateTime.optional(),
  status: meetingStatusSchema.default('INITIAL'),
  participants: z.array(participantSchema),
});

export type CreateMeetingDTO = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingDTO = z.infer<typeof updateMeetingSchema>;
export type MeetingDTO = z.infer<typeof meetingSchema>;
