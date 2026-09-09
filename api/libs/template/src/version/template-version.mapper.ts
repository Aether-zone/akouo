import { TemplateVersionDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { TemplateVersion } from './template-version.entity';

@Injectable()
export class TemplateVersionMapper {
  /**
   * The template id is passed in rather than read off `entity.template`, because
   * versions loaded for a template carry no back-reference.
   */
  toDTO(entity: TemplateVersion, templateId: string): TemplateVersionDTO {
    return {
      id: entity.id,
      templateId,
      version: entity.version,
      content: entity.content,
      prompt: entity.prompt,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
    };
  }
}
