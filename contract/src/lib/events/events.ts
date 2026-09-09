import { z } from 'zod';

import { meetingSchema } from '../meeting';

/**
 * Routing keys akouo publishes under.
 *
 * Named constants rather than string literals at each call site, because a
 * publisher and a subscriber that disagree about a key fail silently: the
 * message goes to the exchange, matches nothing, and is dropped. Nothing errors
 * and nothing arrives.
 */
export const MEETING_CREATED = 'meeting.created';

/**
 * A meeting now exists.
 *
 * Carries the whole {@link meetingSchema}, not just an id. A subscriber in
 * another service cannot read akouo's database, and one that could would be
 * reading a row that has moved on since the event was sent. What is in here is
 * what was true when it happened, which is what an event is for.
 *
 * The envelope — `id`, `occurredAt`, `accessToken` — is organon's `RabbitEvent`
 * and is added by its publisher, so it is deliberately not repeated here.
 */
export const meetingCreatedSchema = z.object({
  meeting: meetingSchema,
});

export type MeetingCreatedEvent = z.infer<typeof meetingCreatedSchema>;
