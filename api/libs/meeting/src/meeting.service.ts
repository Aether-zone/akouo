import {
  AETHER_SOURCE,
  CreateMeetingDTO,
  MEETING_CREATED,
  MEETING_DELETED,
  MEETING_UPDATED,
  MeetingDTO,
  UpdateMeetingDTO,
  fromIsoDateTime,
} from '@akouo/contract';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';

import { EventPublisher } from '@aether-zone/organon';
import type { Actor, AetherEvent } from '@aether-zone/organon';

import { Meeting } from './meeting.entity';
import {
  meetingIri,
  toMeetingDocument,
  type MeetingJsonLD,
} from './meeting.json-ld';
import { MeetingMapper } from './meeting.mapper';
import { Participant } from './participant/participant.entity';
import { Person } from '@akouo/person/person.entity';
import type { Location } from '@akouo/location/location.entity';
import { LocationService } from '@akouo/location/location.service';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    @Inject('MEETING_REPOSITORY')
    private readonly meetingRepository: Repository<Meeting>,
    @Inject('MEETING_PERSON_REPOSITORY')
    private readonly personRepository: Repository<Person>,
    private readonly locations: LocationService,
    private readonly meetingMapper: MeetingMapper,
    private readonly events: EventPublisher,
  ) { }

  /**
   * Refuses people who can no longer be put on a meeting.
   *
   * A person may only join a *new* participation if prosopone still knows
   * them — that is what a non-null `sourceUri` means. Someone prosopone has
   * deleted keeps their place in meetings that already happened, but joining
   * something new would create a participation referencing a person the
   * workspace can no longer name: `toMeetingDocument` drops those, so the
   * meeting would publish with the attendee silently missing.
   *
   * Refused rather than filtered. A caller who asked for four attendees and
   * got three, with no explanation, has been told nothing — and would find out
   * from the meeting, later, in front of everyone.
   *
   * This also excludes people who predate the event stream, whose `sourceUri`
   * is null for the other reason. That is the same rule and, deliberately, the
   * same answer: akouo cannot name them either.
   */
  private async refuseUnlinked(
    organizationId: string,
    personIds: string[],
  ): Promise<void> {
    if (personIds.length === 0) {
      return;
    }

    const people = await this.personRepository.find({
      where: personIds.map((id) => ({ id, organizationId })),
    });

    const found = new Map(people.map((person) => [person.id, person]));

    const unusable = personIds.filter(
      (id) => !found.has(id) || found.get(id)!.sourceUri === null,
    );

    if (unusable.length > 0) {
      throw new BadRequestException({
        message:
          'These people can no longer be added to a meeting: prosopone does not know them.',
        errors: unusable.map((id) => ({
          path: 'participants',
          message: `${found.get(id)?.name ?? id} is not linked to a person in prosopone.`,
        })),
      });
    }
  }

  /**
   * Announces what happened to a meeting, without letting the broker fail the
   * request.
   *
   * The row is already written by the time this runs, and a caller who has just
   * created or changed a meeting should not be told it failed because a queue
   * was down. What is lost is the work that follows — so the failure is logged
   * loudly rather than swallowed quietly, and the row is still there to replay
   * from.
   *
   * The honest fix for that gap is an outbox: write the event in the same
   * transaction as the row and let a relay publish it. That is a bigger change
   * than these events warrant, and this comment is where to start it.
   */
  private async publish(
    event: AetherEvent<MeetingJsonLD>,
    routingKey: string,
  ): Promise<void> {
    try {
      await this.events.publish(routingKey, event);
    } catch (cause) {
      this.logger.error(
        `Meeting "${event.subject}" changed but "${routingKey}" could not be published`,
        cause,
      );
    }
  }

  /**
   * The envelope every meeting event shares.
   *
   * `subject` is the meeting's IRI and, on a create or update, must equal the
   * document's `@id` — organon's schema refuses an event where the two
   * disagree, because they are the same fact stated twice and a consumer would
   * file the document under the wrong node.
   *
   * `time` is an ISO 8601 string, not a Date: an event crosses a process
   * boundary as JSON, where a Date arrives as a string anyway.
   */
  private envelope(user: Actor, id: string) {
    return {
      id: randomUUID(),
      source: AETHER_SOURCE,
      time: new Date().toISOString(),
      subject: meetingIri(id),
      organizationId: user.organizationId,
      actor: { id: user.id, type: 'User' },
    };
  }

  async findAll(user: Actor): Promise<MeetingDTO[]> {
    const entities = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.participants', 'participant')
      .leftJoinAndSelect('meeting.location', 'location')
      .where('meeting.organizationId = :organizationId', { organizationId: user.organizationId })
      .orderBy('meeting.startDate', 'DESC')
      .getMany();

    return entities.map((entity) => this.meetingMapper.toDTO(entity));
  }

  /**
   * The caller's meetings that a given person took part in, newest first.
   *
   * The person is matched with `EXISTS` rather than by filtering the joined
   * participants: filtering there would narrow each meeting's `participants` to
   * the one that matched, and a meeting should come back with everyone on it.
   */
  async findAllByPersonId(
    user: Actor,
    personId: string,
  ): Promise<MeetingDTO[]> {
    const entities = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.participants', 'participant')
      .leftJoinAndSelect('meeting.location', 'location')
      .leftJoinAndSelect('participant.person', 'person')
      .where('meeting.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere((qb) => {
        const attended = qb
          .subQuery()
          .select('1')
          .from(Participant, 'attendance')
          .where('attendance.meeting = meeting.id')
          .andWhere('attendance.person = :personId')
          .getQuery();

        return `EXISTS ${attended}`;
      })
      .setParameter('personId', personId)
      .orderBy('meeting.startDate', 'DESC')
      .getMany();

    return entities.map((entity) => this.meetingMapper.toDTO(entity));
  }

  async findById(user: Actor, id: string): Promise<MeetingDTO> {
    return this.meetingMapper.toDTO(await this.loadMeeting(user, id));
  }

  /**
   * The location a meeting names, or null.
   *
   * A 400 rather than a silent null for one this organization does not have:
   * the caller asked for somewhere specific, and a meeting quietly filed as
   * nowhere is worse than being told the id was wrong.
   */
  private async resolveLocation(
    user: Actor,
    locationId: string | null | undefined,
  ): Promise<Location | null> {
    if (!locationId) {
      return null;
    }

    const location = await this.locations.findById(
      user.organizationId,
      locationId,
    );

    if (!location) {
      throw new BadRequestException({
        message: 'That location does not exist in this organization.',
        errors: [{ path: 'locationId', message: 'Unknown location.' }],
      });
    }

    return location;
  }

  async create(user: Actor, meeting: CreateMeetingDTO): Promise<MeetingDTO> {
    await this.refuseUnlinked(
      user.organizationId,
      (meeting.participants || []).map((participant) => participant.personId),
    );

    const entity = this.meetingRepository.create({
      title: meeting.title,
      startDate: meeting.startDate,
      endDate: meeting.endDate,
      organizationId: user.organizationId,
      location: await this.resolveLocation(user, meeting.locationId),
    });

    entity.participants = (meeting.participants || []).map((participant) => {
      const participantEntity: Participant = new Participant();
      participantEntity.meeting = entity;
      participantEntity.person = new Person();
      participantEntity.person.id = participant.personId;

      return participantEntity;
    });

    const saved = await this.meetingRepository.save(entity);
    const created = this.meetingMapper.toDTO(
      await this.loadMeeting(user, saved.id),
    );

    await this.publish(
      {
        ...this.envelope(user, created.id),
        type: 'aether:ResourceCreated',
        data: toMeetingDocument(created),
      },
      MEETING_CREATED,
    );

    return created;
  }

  /**
   * Changes a meeting in place. Only the fields that were sent move, so a caller
   * setting the status — a recording landing, say — leaves the rest alone.
   */
  async updateMeeting(
    user: Actor,
    id: string,
    update: UpdateMeetingDTO,
  ): Promise<MeetingDTO> {
    const entity = await this.loadMeeting(user, id);

    if (update.title !== undefined) {
      entity.title = update.title;
    }
    if (update.startDate !== undefined) {
      entity.startDate = fromIsoDateTime(update.startDate);
    }
    if (update.endDate !== undefined) {
      // `null` clears an end date that was set; `undefined` leaves it be.
      entity.endDate = update.endDate
        ? fromIsoDateTime(update.endDate)
        : (null as unknown as Date);
    }
    if (update.status !== undefined) {
      entity.status = update.status;
    }
    if (update.locationId !== undefined) {
      // `null` clears the location; absent leaves it alone.
      entity.location = await this.resolveLocation(user, update.locationId);
    }
    if (update.participants !== undefined) {
      const existing = entity.participants ?? [];
      const already = new Set(
        existing
          .filter((participant) => participant.person)
          .map((participant) => participant.person.id),
      );

      /*
       * Only the people being *added* are checked. Someone already on the
       * meeting stays whatever prosopone has since done — the meeting happened
       * and they were at it — so re-sending the current set never starts
       * failing because an attendee was deleted upstream.
       */
      await this.refuseUnlinked(
        user.organizationId,
        update.participants
          .map((participant) => participant.personId)
          .filter((personId) => !already.has(personId)),
      );

      entity.participants = this.mergeParticipants(
        existing,
        update.participants.map((participant) => participant.personId),
      );
    }

    await this.meetingRepository.save(entity);

    const updated = this.meetingMapper.toDTO(await this.loadMeeting(user, id));

    /*
     * The whole meeting, not the fields that moved. A consumer holding a graph
     * wants the resource as it now stands; a patch would make it reconstruct
     * that itself, from a base it may never have seen.
     */
    await this.publish(
      {
        ...this.envelope(user, id),
        type: 'aether:ResourceUpdated',
        data: toMeetingDocument(updated),
      },
      MEETING_UPDATED,
    );

    return updated;
  }

  /**
   * The participant rows for a set of people, reusing the rows that are already
   * there.
   *
   * Rebuilding them wholesale would work, but an utterance points at a
   * participant row: recreating the row for someone who never left would drop
   * every line of transcript attributed to them.
   */
  private mergeParticipants(
    existing: Participant[],
    personIds: string[],
  ): Participant[] {
    const byPersonId = new Map(
      existing
        .filter((participant) => participant.person)
        .map((participant) => [participant.person.id, participant]),
    );

    return personIds.map((personId) => {
      const kept = byPersonId.get(personId);

      if (kept) {
        return kept;
      }

      const participant: Participant = new Participant();
      participant.person = new Person();
      participant.person.id = personId;

      return participant;
    });
  }

  /** Removing someone else's meeting is an administrative act, so it needs admin or owner. */
  async delete(user: Actor, id: string): Promise<void> {
    await this.meetingRepository.remove(await this.loadMeeting(user, id));

    /*
     * No `data`: the resource is gone, and there is nothing left to describe.
     * `subject` is all a consumer needs to drop what it holds — which is why
     * organon's schema refuses a delete that carries a document.
     */
    await this.publish(
      { ...this.envelope(user, id), type: 'aether:ResourceDeleted' },
      MEETING_DELETED,
    );
  }

  private async loadMeeting(user: Actor, id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.participants', 'participant')
      .leftJoinAndSelect('meeting.location', 'location')
      .leftJoinAndSelect('participant.person', 'person')
      .where('meeting.id = :id', { id })
      .andWhere('meeting.organizationId = :organizationId', { organizationId: user.organizationId })
      .getOne();

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

}
