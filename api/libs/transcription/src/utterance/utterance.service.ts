import { CreateUtteranceDTO, UpdateUtteranceDTO, UtteranceDTO } from '@akouo/contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';
import { EMBEDDING_EVENT, EmbeddingEvent } from '@akouo/embedding';
import { Participant } from '@akouo/meeting';

import { Transcription } from '../transcription.entity';
import { Utterance } from './utterance.entity';
import { UtteranceMapper } from './utterance.mapper';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UtteranceService {
  constructor(
    @Inject('UTTERANCE_REPOSITORY')
    private readonly utteranceRepository: Repository<Utterance>,
    private readonly utteranceMapper: UtteranceMapper,
    private readonly eventEmitter: EventEmitter2
  ) { }

  /**
   * Writes the turns of a transcription that has just been created. Saved in one
   * call so a transcript either lands whole or not at all, and returned in the
   * order they were spoken.
   */
  async createMany(
    user: Actor,
    transcriptionId: string,
    utterances: CreateUtteranceDTO[],
  ): Promise<UtteranceDTO[]> {
    if (utterances.length === 0) {
      return [];
    }

    const entities = utterances.map((utterance) => {
      const entity: Utterance = this.utteranceMapper.toEntity(utterance);

      entity.transcription = this.transcriptionReference(transcriptionId);

      return entity;
    });

    const saved = await this.utteranceRepository.save(entities);

    // One event per turn: a turn is the unit anyone would want back from a
    // search, so it is the unit that gets embedded.
    saved.forEach((utterance) => this.announceForEmbedding(user, utterance));

    return this.findAll(transcriptionId);
  }

  /** A transcription's turns, in the order they were spoken. */
  async findAll(transcriptionId: string): Promise<UtteranceDTO[]> {
    const entities = await this.utteranceRepository
      .createQueryBuilder('utterance')
      // The participant, and enough of it to map: its DTO names the meeting and
      // person it stands for.
      .leftJoinAndSelect('utterance.participant', 'participant')
      .leftJoinAndSelect('participant.meeting', 'participantMeeting')
      .leftJoinAndSelect('participant.person', 'participantPerson')
      .where('utterance.transcription = :transcriptionId', { transcriptionId })
      .orderBy('utterance.start', 'ASC')
      .getMany();

    return entities.map((entity) =>
      this.utteranceMapper.toDTO(entity, transcriptionId),
    );
  }

  /**
   * Corrects one turn. Whatever was sent is applied and the turn becomes `MANUAL`:
   * a person has been over it, so a later pass should not quietly overwrite it.
   *
   * An utterance has no owner of its own, so the check runs through the transcription
   * holding it — same rule as reading one, in the query that loads it rather than in
   * a separate call to the transcription service, which would make these two modules
   * depend on each other.
   */
  async update(
    user: Actor,
    recordingId: string,
    transcriptionId: string,
    id: string,
    update: UpdateUtteranceDTO,
  ): Promise<UtteranceDTO> {
    const entity = await this.utteranceRepository
      .createQueryBuilder('utterance')
      .innerJoin('utterance.transcription', 'transcription')
      .where('utterance.id = :id', { id })
      .andWhere('transcription.id = :transcriptionId', { transcriptionId })
      .andWhere('transcription.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere('transcription.recording = :recordingId', { recordingId })
      .getOne();

    if (!entity) {
      throw new NotFoundException('Utterance not found');
    }

    if (update.speakerLabel !== undefined) {
      entity.speakerLabel = update.speakerLabel;
    }
    if (update.content !== undefined) {
      entity.content = update.content;
    }
    if (update.participantId !== undefined) {
      // `null` is a real value here: it takes the attribution off again.
      entity.participant = update.participantId
        ? this.participantReference(update.participantId)
        : null;
    }

    entity.origin = 'MANUAL';

    const saved = await this.utteranceRepository.save(entity);

    // Only when the words changed: a vector describes the text, so reassigning a
    // speaker leaves the existing one as good as it was.
    if (update.content !== undefined) {
      this.announceForEmbedding(user, saved);
    }

    return this.findById(transcriptionId, saved.id);
  }

  /** One turn, with its participant resolved the same way a list resolves them. */
  async findById(transcriptionId: string, id: string): Promise<UtteranceDTO> {
    const utterances = await this.findAll(transcriptionId);
    const utterance = utterances.find((candidate) => candidate.id === id);

    if (!utterance) {
      throw new NotFoundException('Utterance not found');
    }

    return utterance;
  }

  /**
   * Says that a turn's words are worth embedding, and leaves it there.
   *
   * Whether anything embeds them, with which model, and where the vector goes is
   * none of this library's business — which is the point of announcing it rather
   * than calling an embedding service.
   */
  private announceForEmbedding(user: Actor, utterance: Utterance): void {
    this.eventEmitter.emit(
      EMBEDDING_EVENT,
      new EmbeddingEvent('UTTERANCE', utterance.id, utterance.content, user),
    );
  }

  /** A detached Participant carrying just the id, enough to write the FK. */
  private participantReference(id: string): Participant {
    const participant: Participant = new Participant();
    participant.id = id;

    return participant;
  }

  /** A detached Transcription carrying just the id, enough to write the FK. */
  private transcriptionReference(id: string): Transcription {
    const transcription: Transcription = new Transcription();
    transcription.id = id;

    return transcription;
  }
}
