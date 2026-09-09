import { z } from 'zod';

/**
 * How far a meeting has got: scheduled and nothing more, a recording stored
 * against it, or that recording transcribed.
 */
export const MEETING_STATUSES = ['INITIAL', 'RECORDED', 'TRANSCRIBED'] as const;

export const meetingStatusSchema = z.enum(MEETING_STATUSES);

export type MeetingStatus = (typeof MEETING_STATUSES)[number];
