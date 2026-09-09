import { CreateTranscriptionDTO, TranscriptionDTO, UpdateTranscriptionDTO } from '@akouo/contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';
import { EMBEDDING_EVENT, EmbeddingEvent } from '@akouo/embedding';
import { Recording } from '@akouo/recording';

import { Transcription } from './transcription.entity';
import { TranscriptionMapper } from './transcription.mapper';
import { UtteranceService } from './utterance/utterance.service';

@Injectable()
export class TranscriptionService {
  constructor(
    @Inject('TRANSCRIPTION_REPOSITORY')
    private readonly transcriptionRepository: Repository<Transcription>,
    private readonly transcriptionMapper: TranscriptionMapper,
    private readonly utteranceService: UtteranceService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(
    user: Actor,
    meetingId: string,
    recordingId: string,
  ): Promise<TranscriptionDTO[]> {
    const entities = await this.transcriptionRepository
      .createQueryBuilder('transcription')
      .leftJoinAndSelect('transcription.utterances', 'utterance')
      .leftJoinAndSelect('utterance.participant', 'participant')
      .leftJoinAndSelect('participant.meeting', 'participantMeeting')
      .leftJoinAndSelect('participant.person', 'participantPerson')
      .where('transcription.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere('transcription.recording = :recordingId', { recordingId })
      // Oldest first: `create` appends, so this is the order they were added in.
      .orderBy('transcription.createdAt', 'ASC')
      // Within a transcription, the order the turns were spoken in.
      .addOrderBy('utterance.start', 'ASC')
      .getMany();

    return entities.map((entity) =>
      this.transcriptionMapper.toDTO(entity, recordingId),
    );
  }

  async findById(
    user: Actor,
    meetingId: string,
    recordingId: string,
    id: string,
  ): Promise<TranscriptionDTO> {
    return this.transcriptionMapper.toDTO(
      await this.loadTranscription(user, recordingId, id),
      recordingId,
    );
  }

  /**
   * Any member of the organization can add a transcription. A recording can hold
   * several, so this always appends rather than replacing what is already there.
   */
  async create(
    user: Actor,
    meetingId: string,
    recordingId: string,
    transcription: CreateTranscriptionDTO,
  ): Promise<TranscriptionDTO> {
    const entity: Transcription =
      this.transcriptionMapper.toEntity(transcription);

    // Every read here filters on the owner, so an unstamped row would be invisible
    // to the caller that just created it.
    entity.createdBy = user.id;
    entity.organizationId = user.organizationId;
    entity.recording = this.recordingReference(recordingId);

    const saved = await this.transcriptionRepository.save(entity);

    // After the transcription, never before: each utterance points at it, so there
    // is nothing to hang them off until the row exists.
    await this.utteranceService.createMany(
      user,
      saved.id,
      transcription.utterances,
    );

    // The whole transcript as one piece, alongside the turns the utterances
    // announce: a question about what a meeting was for is answered by the
    // former, and one about who said what by the latter.
    this.announceForEmbedding(user, saved);

    return this.transcriptionMapper.toDTO(
      await this.loadTranscription(user, recordingId, saved.id),
      recordingId,
    );
  }

  /**
   * Corrects the text of a transcription, which makes it `MANUAL`: from here on it
   * is a person's version of what was said, not the transcriber's.
   */
  async update(
    user: Actor,
    meetingId: string,
    recordingId: string,
    id: string,
    update: UpdateTranscriptionDTO,
  ): Promise<TranscriptionDTO> {
    const entity = await this.loadTranscription(user, recordingId, id);

    entity.content = update.content;
    entity.origin = 'MANUAL';

    const saved = await this.transcriptionRepository.save(entity);

    // The words changed, so whatever was embedded from them is out of date.
    this.announceForEmbedding(user, saved);

    return this.transcriptionMapper.toDTO(
      await this.loadTranscription(user, recordingId, id),
      recordingId,
    );
  }

  async delete(
    user: Actor,
    meetingId: string,
    recordingId: string,
    id: string,
  ): Promise<void> {
    await this.transcriptionRepository.remove(
      await this.loadTranscription(user, recordingId, id),
    );
  }

  private async loadTranscription(
    user: Actor,
    recordingId: string,
    id: string,
  ): Promise<Transcription> {
    const transcription = await this.transcriptionRepository
      .createQueryBuilder('transcription')
      .leftJoinAndSelect('transcription.utterances', 'utterance')
      .leftJoinAndSelect('utterance.participant', 'participant')
      .leftJoinAndSelect('participant.meeting', 'participantMeeting')
      .leftJoinAndSelect('participant.person', 'participantPerson')
      .where('transcription.id = :id', { id })
      .andWhere('transcription.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere('transcription.recording = :recordingId', { recordingId })
      .orderBy('utterance.start', 'ASC')
      .getOne();

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    return transcription;
  }

  /**
   * Says that a transcription's text is worth embedding, and leaves it there.
   *
   * Whether anything embeds it, with which model, and where the vector goes is
   * none of this library's business — which is the point of announcing it rather
   * than calling an embedding service.
   */
  private announceForEmbedding(user: Actor, transcription: Transcription): void {
    this.eventEmitter.emit(
      EMBEDDING_EVENT,
      new EmbeddingEvent(
        'TRANSCRIPTION',
        transcription.id,
        transcription.content,
        user,
      ),
    );
  }

  /** A detached Recording carrying just the id, enough for TypeORM to write the FK. */
  private recordingReference(id: string): Recording {
    const recording: Recording = new Recording();
    recording.id = id;

    return recording;
  }
}
