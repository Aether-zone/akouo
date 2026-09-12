import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  aetherEventSchema,
  Public,
  type JsonLdDocument,
} from '@aether-zone/organon';

import { PersonService } from './person.service';

/** The `@type` of a person document, in prosopone's vocabulary. */
const PERSON_TYPE = 'aether:Person';

/**
 * People announced by prosopone, recorded in akouo.
 *
 * akouo no longer creates people through its own api — its POST and DELETE
 * endpoints are gone. A person exists because prosopone said so, and this is
 * where that arrives.
 *
 * Subscribes to `#` rather than to `person.created`, and decides from the
 * event's own `@type`. A routing key is the producer's word for what happened;
 * the document says what the resource *is*, and only the second survives
 * another service learning to announce people under a key of its own.
 *
 * The queue is akouo's own and durable. Two consumers of one exchange need two
 * queues or they take turns eating each other's events, and an anonymous queue
 * is exclusive — it would vanish with the process and lose whatever arrived
 * while akouo was restarting.
 */
@Injectable()
export class PersonListener {
  private readonly logger = new Logger(PersonListener.name);

  constructor(private readonly people: PersonService) { }

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
    queue: 'akouo.people',
    queueOptions: { durable: true },
  })
  async handle(message: unknown): Promise<Nack | undefined> {
    console.log('Got message', message);
    const parsed = aetherEventSchema.safeParse(message);

    if (!parsed.success) {
      console.log('error', parsed);
      // Not an Aether event, or malformed. Dropped rather than requeued: it
      // will not become valid on a second reading, and requeuing something
      // that can never succeed is a loop that takes the queue down with it.
      return new Nack(false);
    }

    const event = parsed.data;

    if (event.type === 'aether:ResourceDeleted') {
      if (!event.organizationId) {
        this.logger.warn(
          `"${event.type}" for ${event.subject} carries no organizationId; dropping it`,
        );

        return new Nack(false);
      }

      /*
       * The person stays; only the link goes. They may sit on a meeting that
       * happened, and deleting the row would orphan those participations or
       * rewrite history to say the meeting had one fewer attendee — neither of
       * which is true. See `PersonService.unlinkFromSource`.
       */
      try {
        const unlinked = await this.people.unlinkFromSource(
          event.organizationId,
          event.subject,
        );

        if (unlinked) {
          this.logger.log(
            `${event.subject} was deleted in prosopone; kept the person and cut the link`,
          );
        }

        return undefined;
      } catch (cause) {
        this.logger.error(
          `${event.subject} could not be unlinked; requeuing`,
          cause,
        );

        return new Nack(true);
      }
    }

    const document = event.data as JsonLdDocument;

    if (document['@type'] !== PERSON_TYPE) {
      // Someone else's resource. The exchange carries every service's events,
      // so this is the ordinary path rather than a problem.
      return undefined;
    }

    if (!event.organizationId) {
      /*
       * Nothing can be done with this. `organizationId` is NOT NULL on the
       * row, and filing the person under a guessed tenant would put them where
       * another organization can read them. Dropped, and said out loud —
       * unlike the cases above, this one is a producer that needs fixing.
       */
      this.logger.warn(
        `"${event.type}" for ${event.subject} carries no organizationId; dropping it`,
      );

      return new Nack(false);
    }

    const name = fullName(document);

    if (!name) {
      this.logger.warn(
        `${event.subject} has no name akouo can use; dropping it`,
      );

      return new Nack(false);
    }

    try {
      const person = await this.people.upsertFromEvent({
        organizationId: event.organizationId,
        sourceUri: event.subject,
        name,
        createdBy: event.actor?.id ?? null,
      });

      console.log(person);

      this.logger.log(
        `Recorded "${name}" (${event.subject}) as person ${person.id}`,
      );

      return undefined;
    } catch (cause) {
      /*
       * The database failed, which may well be temporary — so this one *is*
       * requeued. The write is idempotent on `sourceUri`, so a redelivery
       * updates rather than duplicates and costs only the round trip.
       */
      this.logger.error(
        `${event.subject} could not be recorded; requeuing`,
        cause,
      );

      return new Nack(true);
    }
  }
}

/**
 * A display name from the document's parts.
 *
 * akouo's Person has one `name` column, and prosopone states given and family
 * names separately — so the join happens here rather than akouo growing two
 * columns it has nowhere to show. Either part alone is still a name worth
 * keeping; neither is not.
 */
function fullName(document: JsonLdDocument): string {
  const given = asText(document.givenName);
  const family = asText(document.familyName);

  return [given, family].filter(Boolean).join(' ').trim();
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
