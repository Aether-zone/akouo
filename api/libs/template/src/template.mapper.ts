import { CreateTemplateDTO, TemplateDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Template } from './template.entity';

@Injectable()
export class TemplateMapper {
  toDTO(entity: Template): TemplateDTO {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      content: entity.content,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
    };
  }

  toEntity(dto: CreateTemplateDTO): Template {
    const entity: Template = new Template();

    entity.name = dto.name;
    entity.description = dto.description ?? null;
    entity.content = dto.content;

    return entity;
  }
}
