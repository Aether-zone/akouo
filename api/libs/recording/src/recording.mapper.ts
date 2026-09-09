import { RecordingDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';
import { FileMapper, StoredFile } from '@akouo/common';

import { Recording } from './recording.entity';

@Injectable()
export class RecordingMapper {
  constructor(private readonly fileMapper: FileMapper) {}

  /**
   * The meeting id is passed in rather than read off `entity.meeting`, because
   * recordings loaded as a meeting's `recordings` relation carry no back-reference.
   */
  toDTO(entity: Recording, meetingId: string): RecordingDTO {
    return {
      id: entity.id,
      file: this.fileMapper.toDTO(entity.file),
      meetingId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
    };
  }

  /**
   * Takes the stored file rather than the DTO: the id on the way in has already been
   * resolved to a real file, and a recording is nothing but a meeting and that file.
   */
  toEntity(file: StoredFile): Recording {
    const entity: Recording = new Recording();

    entity.file = file;

    return entity;
  }
}
