import { ExtractionDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Extraction } from './extraction.entity';

@Injectable()
export class ExtractionMapper {
  /**
   * The ids are passed in rather than read off the relations, which are not
   * loaded on a row that was just written.
   */
  toDTO(
    entity: Extraction,
    templateVersionId: string,
    transcriptionId: string,
  ): ExtractionDTO {
    return {
      id: entity.id,
      templateVersionId,
      transcriptionId,
      output: entity.output,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
    };
  }
}
