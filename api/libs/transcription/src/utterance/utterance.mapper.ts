import { CreateUtteranceDTO, UtteranceDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Participant, ParticipantMapper } from '@akouo/meeting';

import { Utterance } from './utterance.entity';

@Injectable()
export class UtteranceMapper {
  constructor(private readonly participantMapper: ParticipantMapper) {}

  /**
   * The transcription id is passed in rather than read off `entity.transcription`,
   * because utterances loaded as a transcription's relation carry no back-reference.
   *
   * A participant is mapped only when it was joined and is still there: an utterance
   * nobody has attributed yet, and one whose participant has since left the meeting,
   * both read as `null`.
   */
  toDTO(entity: Utterance, transcriptionId: string): UtteranceDTO {
    return {
      id: entity.id,
      transcriptionId,
      speakerLabel: entity.speakerLabel,
      participant: entity.participant
        ? this.participantMapper.toDTO(
            entity.participant,
            entity.participant.meeting?.id ?? '',
          )
        : null,
      content: entity.content,
      confidence: entity.confidence,
      start: entity.start,
      end: entity.end,
      origin: entity.origin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toEntity(dto: CreateUtteranceDTO): Utterance {
    const entity: Utterance = new Utterance();

    entity.speakerLabel = dto.speakerLabel;
    entity.participant = dto.participantId
      ? this.participantReference(dto.participantId)
      : null;
    entity.content = dto.content;
    entity.confidence = dto.confidence;
    entity.start = dto.start;
    entity.end = dto.end;
    entity.origin = 'TRANSCRIBED';

    return entity;
  }

  /** A detached Participant carrying just the id, enough to write the FK. */
  private participantReference(id: string): Participant {
    const participant: Participant = new Participant();
    participant.id = id;

    return participant;
  }
}
