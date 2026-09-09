import { CreateParticipantDTO, ParticipantDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Participant } from './participant.entity';
import { Person } from '@akouo/person/person.entity';
import { Meeting } from '../meeting.entity';

@Injectable()
export class ParticipantMapper {
  /**
   * The meeting id is passed in rather than read off `entity.meeting`, because
   * participants loaded as a meeting's relation carry no back-reference.
   */
  toDTO(entity: Participant, meetingId: string): ParticipantDTO {
    return {
      id: entity.id,
      personId: entity.person ? entity.person.id : '',
      meetingId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toEntity(dto: CreateParticipantDTO, meetingId: string): Participant {
    const entity: Participant = new Participant();

    entity.person = new Person();
    entity.person.id = dto.personId;
    entity.meeting = new Meeting();
    entity.meeting.id = meetingId;
    return entity;
  }
}
