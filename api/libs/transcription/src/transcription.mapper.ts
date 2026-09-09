import { CreateTranscriptionDTO, TranscriptionDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Transcription } from './transcription.entity';
import { UtteranceMapper } from './utterance/utterance.mapper';

@Injectable()
export class TranscriptionMapper {
  constructor(private readonly utteranceMapper: UtteranceMapper) {}

  /**
   * The recording id is passed in rather than read off `entity.recording`, because
   * transcriptions loaded as a recording's relation carry no back-reference.
   */
  toDTO(entity: Transcription, recordingId: string): TranscriptionDTO {
    return {
      id: entity.id,
      content: entity.content,
      recordingId,
      origin: entity.origin,
      // Empty when the relation was not joined, which reads the same as a
      // transcription that was never diarized.
      utterances: (entity.utterances ?? []).map((utterance) =>
        this.utteranceMapper.toDTO(utterance, entity.id),
      ),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
    };
  }

  /** Utterances are written separately, once the transcription they hang off exists. */
  toEntity(dto: CreateTranscriptionDTO): Transcription {
    const entity: Transcription = new Transcription();

    entity.content = dto.content;
    // A transcriber wrote it; only an edit through the API makes it MANUAL.
    entity.origin = 'TRANSCRIBED';

    return entity;
  }
}
