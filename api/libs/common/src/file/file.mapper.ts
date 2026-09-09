import { FileDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { StoredFile } from './file.entity';

@Injectable()
export class FileMapper {
  /** The bucket stays server-side: it says nothing useful to a client. */
  toDTO(entity: StoredFile): FileDTO {
    return {
      id: entity.id,
      key: entity.key,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      size: entity.size,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
      version: entity.version,
      status: entity.status,
    };
  }
}
