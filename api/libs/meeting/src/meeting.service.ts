import {
  CreateMeetingDTO,
  MEETING_CREATED,
  MeetingDTO,
  UpdateMeetingDTO,
  fromIsoDateTime,
} from '@akouo/contract';
import type { MeetingCreatedEvent } from '@akouo/contract';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { EventPublisher } from '@aether-zone/organon';
import type { Actor } from '@aether-zone/organon';

import { Meeting } from './meeting.entity';
import { MeetingMapper } from './meeting.mapper';
import { Participant } from './participant/participant.entity';
import { Person } from '@akouo/person/person.entity';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    @Inject('MEETING_REPOSITORY')
    private readonly meetingRepository: Repository<Meeting>,
    private readonly meetingMapper: MeetingMapper,
    private readonly events: EventPublisher,
  ) { }

  /**
   * Announces the new meeting, without letting the broker fail the request.
   *
   * The meeting is already saved by the time this runs, and a caller who has
   * just created one should not be told it failed because a queue was down.
   * What is lost is the work that follows — so the failure is logged loudly
   * rather than swallowed quietly, and the row is still there to replay from.
   *
   * The honest fix for that gap is an outbox: write the event in the same
   * transaction as the row and let a relay publish it. That is a bigger change
   * than a first event warrants, and this comment is where to start it.
   */
  private async publishCreated(meeting: MeetingDTO): Promise<void> {
    const event: MeetingCreatedEvent = { meeting };

    try {
      await this.events.publish(MEETING_CREATED, event);
    } catch (cause) {
      this.logger.error(
        `Meeting "${meeting.id}" was created but "${MEETING_CREATED}" could not be published`,
        cause,
      );
    }
  }

  async findAll(user: Actor): Promise<MeetingDTO[]> {
    const entities = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.participants', 'participant')
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

  async create(user: Actor, meeting: CreateMeetingDTO): Promise<MeetingDTO> {
    const entity = this.meetingRepository.create({
      title: meeting.title,
      startDate: meeting.startDate,
      endDate: meeting.endDate,
      organizationId: user.organizationId,
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

    await this.publishCreated(created);

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
    if (update.participants !== undefined) {
      entity.participants = this.mergeParticipants(
        entity.participants ?? [],
        update.participants.map((participant) => participant.personId),
      );
    }

    await this.meetingRepository.save(entity);

    return this.meetingMapper.toDTO(await this.loadMeeting(user, id));
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
  }

  private async loadMeeting(user: Actor, id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.participants', 'participant')
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
