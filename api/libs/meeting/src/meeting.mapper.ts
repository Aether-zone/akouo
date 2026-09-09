import { CreateMeetingDTO, MeetingDTO, fromIsoDateTime, toIsoDateTime } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Meeting } from './meeting.entity';
import { ParticipantMapper } from './participant/participant.mapper';

@Injectable()
export class MeetingMapper {
  constructor(private readonly participantMapper: ParticipantMapper) { }

  toDTO(entity: Meeting): MeetingDTO {
    return {
      id: entity.id,
      title: entity.title,
      startDate: toIsoDateTime(entity.startDate),
      endDate: entity.endDate ? toIsoDateTime(entity.endDate) : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      status: entity.status,
      participants: (entity.participants ?? []).map((participant) =>
        this.participantMapper.toDTO(participant, entity.id),
      ),
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
    };
  }

  toEntity(dto: CreateMeetingDTO): Meeting {
    const entity: Meeting = new Meeting();

    entity.title = dto.title;
    entity.startDate = fromIsoDateTime(dto.startDate);
    if (dto.endDate) {
      entity.endDate = fromIsoDateTime(dto.endDate);
    }

    entity.participants = [];
    (dto.participants || []).forEach((participant) => {
      entity.participants.push(
        this.participantMapper.toEntity(participant, entity.id),
      );
    });

    return entity;
  }
}
