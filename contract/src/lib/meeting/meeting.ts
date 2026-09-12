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
    /**
     * Where it is, if anywhere.
     *
     * Optional because plenty of meetings have no place — a call is not
     * somewhere. Null clears one that was set; absent leaves it alone, which
     * is the distinction `updateMeetingSchema` relies on.
     */
    locationId: z.uuid().nullable().optional(),
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
  /** `null` clears the location; absent leaves it as it is. */
  locationId: z.uuid().nullable().optional(),
});

export const meetingSchema = auditedSchema.extend({
  title: z.string(),
  startDate: IsoDateTime,
  endDate: IsoDateTime.optional(),
  status: meetingStatusSchema.default('INITIAL'),
  participants: z.array(participantSchema),
  /** Where it is, or null. akouo's own id for the location, not the place IRI. */
  locationId: z.uuid().nullable(),
  /**
   * The IRI the *workspace* knows that location by — what a published meeting
   * document references.
   *
   * Not derivable from `locationId`: akouo's row id is a different identifier
   * for the same place, and a document naming it would point at a node nobody
   * else has. Exactly the distinction `personUri` draws on a participant.
   *
   * Null when there is no location, or when topos has deleted the place it
   * came from — an unlinked location has no IRI to give.
   */
  locationUri: z.string().nullable(),
});

export type CreateMeetingDTO = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingDTO = z.infer<typeof updateMeetingSchema>;
export type MeetingDTO = z.infer<typeof meetingSchema>;
