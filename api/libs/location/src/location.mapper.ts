import { LocationDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Location } from './location.entity';

@Injectable()
export class LocationMapper {
  toDTO(entity: Location): LocationDTO {
    return {
      id: entity.id,
      name: entity.name,
      uri: entity.uri,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
