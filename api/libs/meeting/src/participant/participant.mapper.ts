import { CreateParticipantDTO, ParticipantDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Participant } from './participant.entity';
import { Person } from '@akouo/person/person.entity';
import { personUri } from '@akouo/person/person.uri';
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
      // The IRI the workspace knows them by — `sourceUri` when prosopone
      // announced them, akouo's own namespace when it did not. Null only when
      // the relation was not loaded, which is a query bug rather than a state.
      personUri: entity.person ? personUri(entity.person) : null,
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
