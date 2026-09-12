import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  aetherEventSchema,
  Public,
  type JsonLdDocument,
} from '@aether-zone/organon';

import { MeetingProjectionService } from './meeting.projection';

/**
 * The `@type`s aether puts on a calendar entry that akouo should record.
 *
 * Every entry carries `aether:Event`; the second type says what kind. Only
 * some kinds are meetings in akouo's sense — something with people, that can
 * have a recording and a transcript.
 *
 * `Call` is in because a remote meeting is exactly the sort of thing anyone
 * records. `Appointment` is out: it is a slot somebody else runs, usually with
 * no attendees akouo knows, and a meeting with nobody in it is not what this
 * service is for. `Deadline`, `Reminder` and `OutOfOffice` are not occasions
 * with people at all.
 *
 * Adding a kind here is the whole of the change — nothing else branches on it.
 */
const MEETING_TYPES = ['aether:Meeting', 'aether:Call'];

/** Every calendar entry carries this, whatever kind it is. */
const EVENT_TYPE = 'aether:Event';

/**
 * Calendar entries announced by aether's chronos, recorded as akouo meetings.
 *
 * Subscribes to `#` and decides from the document's own `@type` rather than
 * from the routing key: a key is the producer's word for what happened, and
 * the document says what the resource *is*.
 *
 * Its own durable queue. Two consumers of one exchange need two queues or they
 * take turns eating each other's events, and an anonymous queue is exclusive —
 * it would vanish with the process and lose whatever arrived while akouo was
 * restarting.
 */
@Injectable()
export class EventListener {
  private readonly logger = new Logger(EventListener.name);

  constructor(private readonly projection: MeetingProjectionService) {}

  /*
   * `@Public()` on something that is not a route: organon's JWT guard is an
   * `APP_GUARD`, and a global guard runs on every execution context — an AMQP
   * delivery included. There is no request behind one, so the token extractor
   * throws before this method is entered, the `Nack` decisions never run, and
   * the broker redelivers for ever.
   */
  @Public()
  @RabbitSubscribe({
    exchange: 'aether-zone',
    routingKey: '#',
    queue: 'akouo.events',
    queueOptions: { durable: true },
  })
  async handle(message: unknown): Promise<Nack | undefined> {
    const parsed = aetherEventSchema.safeParse(message);

    if (!parsed.success) {
      // Dropped rather than requeued: it will not become valid on a second
      // reading, and requeuing what can never succeed is a loop.
      return new Nack(false);
    }

    const event = parsed.data;
    const deleted = event.type === 'aether:ResourceDeleted';

    /*
     * A delete carries no document, so its kind cannot be read from one. The
     * IRI prefix is all there is — and it only says this was a calendar entry,
     * not which kind. That is enough: unlinking something akouo never recorded
     * is a no-op.
     */
    if (deleted) {
      if (!event.subject.startsWith('urn:aether:event:')) {
        return undefined;
      }
    } else if (!isRecordableMeeting(event.data as JsonLdDocument)) {
      // Someone else's resource, or a kind akouo has no use for. The exchange
      // carries every service's events, so this is the ordinary path.
      return undefined;
    }

    if (!event.organizationId) {
      /*
       * `organizationId` is NOT NULL on every row this would touch, and filing
       * a meeting under a guessed tenant would put it where another
       * organization can read it.
       */
      this.logger.warn(
        `"${event.type}" for ${event.subject} carries no organizationId; dropping it`,
      );

      return new Nack(false);
    }

    try {
      if (deleted) {
        const unlinked = await this.projection.unlinkFromSource(
          event.organizationId,
          event.subject,
        );

        if (unlinked) {
          this.logger.log(
            `${event.subject} was deleted in aether; kept the meeting and cut the link`,
          );
        }

        return undefined;
      }

      const meeting = await this.projection.upsertFromEvent(
        event.organizationId,
        event.subject,
        event.data as JsonLdDocument,
        event.actor?.id ?? null,
      );

      this.logger.log(
        `Recorded ${event.subject} as meeting ${meeting.id}`,
      );

      return undefined;
    } catch (cause) {
      /*
       * The database failed, which may well be temporary — so this one *is*
       * requeued. The write is idempotent on `sourceUri`, so a redelivery
       * updates rather than duplicates.
       */
      this.logger.error(
        `${event.subject} could not be recorded; requeuing`,
        cause,
      );

      return new Nack(true);
    }
  }
}

/** Whether a document is a calendar entry of a kind akouo records. */
function isRecordableMeeting(document: JsonLdDocument): boolean {
  const types = Array.isArray(document?.['@type'])
    ? (document['@type'] as string[])
    : [document?.['@type']];

  return (
    types.includes(EVENT_TYPE) &&
    types.some((type) => MEETING_TYPES.includes(type as string))
  );
}
