import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  aetherEventSchema,
  Public,
  type JsonLdDocument,
} from '@aether-zone/organon';

import { LocationService } from './location.service';

/** The `@type` of a place document, in topos's vocabulary. */
const PLACE_TYPE = 'aether:Place';

/**
 * Places announced by topos, recorded as akouo's locations.
 *
 * Subscribes to `#` and decides from the document's own `@type` rather than
 * from the routing key. A key is the producer's word for what happened; the
 * document says what the resource *is*, and only the second survives another
 * service learning to announce places under a key of its own.
 *
 * Its own durable queue: two consumers of one exchange need two queues or they
 * take turns eating each other's events, and an anonymous queue is exclusive —
 * it would vanish with the process and lose whatever arrived while akouo was
 * restarting.
 */
@Injectable()
export class LocationListener {
  private readonly logger = new Logger(LocationListener.name);

  constructor(private readonly locations: LocationService) {}

  /*
   * `@Public()` on something that is not a route: `PistisAuthModule` registers
   * its JWT guard as an `APP_GUARD`, and a global guard in Nest runs on every
   * execution context — an AMQP delivery included. There is no request behind
   * one, so the token extractor reads `headers.authorization` off undefined
   * and throws *before* this method is entered, which means the `Nack`
   * decisions below never run and the broker redelivers for ever.
   */
  @Public()
  @RabbitSubscribe({
    exchange: 'aether-zone',
    routingKey: '#',
    queue: 'akouo.locations',
    queueOptions: { durable: true },
  })
  async handle(message: unknown): Promise<Nack | undefined> {
    const parsed = aetherEventSchema.safeParse(message);

    if (!parsed.success) {
      // Not an Aether event, or malformed. Dropped rather than requeued: it
      // will not become valid on a second reading, and requeuing something
      // that can never succeed is a loop that takes the queue down with it.
      return new Nack(false);
    }

    const event = parsed.data;
    const deleted = event.type === 'aether:ResourceDeleted';

    /*
     * A delete carries no document, so its type cannot be read from one. The
     * IRI is what identifies it, and topos mints places under a prefix of
     * their own — which is the only thing distinguishing a deleted place from
     * a deleted person on this queue.
     */
    if (deleted) {
      if (!event.subject.startsWith('urn:aether:place:')) {
        return undefined;
      }
    } else if ((event.data as JsonLdDocument)['@type'] !== PLACE_TYPE) {
      // Someone else's resource. The exchange carries every service's events,
      // so this is the ordinary path rather than a problem.
      return undefined;
    }

    if (!event.organizationId) {
      /*
       * Nothing can be done with this: `organizationId` is NOT NULL on the
       * row, and filing a location under a guessed tenant would put it where
       * another organization can read it.
       */
      this.logger.warn(
        `"${event.type}" for ${event.subject} carries no organizationId; dropping it`,
      );

      return new Nack(false);
    }

    try {
      if (deleted) {
        const unlinked = await this.locations.unlinkFromSource(
          event.organizationId,
          event.subject,
        );

        if (unlinked) {
          this.logger.log(
            `${event.subject} was deleted in topos; kept the location and cut the link`,
          );
        }

        return undefined;
      }

      const name = asText((event.data as JsonLdDocument).name);

      if (!name) {
        this.logger.warn(
          `${event.subject} has no name akouo can use; dropping it`,
        );

        return new Nack(false);
      }

      const location = await this.locations.upsertFromEvent({
        organizationId: event.organizationId,
        uri: event.subject,
        name,
        createdBy: event.actor?.id ?? null,
      });

      this.logger.log(
        `Recorded "${name}" (${event.subject}) as location ${location.id}`,
      );

      return undefined;
    } catch (cause) {
      /*
       * The database failed, which may well be temporary — so this one *is*
       * requeued. The write is idempotent on `uri`, so a redelivery updates
       * rather than duplicates and costs only the round trip.
       */
      this.logger.error(
        `${event.subject} could not be recorded; requeuing`,
        cause,
      );

      return new Nack(true);
    }
  }
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
