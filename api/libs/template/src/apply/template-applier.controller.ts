import { applyTemplateSchema } from '@akouo/contract';
import type { AppliedTemplateDTO, ApplyTemplateDTO } from '@akouo/contract';
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import { ZodValidationPipe } from '@akouo/common';
import { TranscriptionService } from '@akouo/transcription';

import { TemplateVersionService } from '../version/template-version.service';
import { TemplateApplier } from './template-applier';


/**
 * Applying a version to a transcription.
 *
 * Both halves are loaded through their own services first, which is what proves
 * the caller may read them — the applier itself takes DTOs and checks nothing.
 */
@Controller('organizations/:organizationId/templates/:templateId/versions/:versionId/apply')
@UseGuards(OrganizationGuard)
export class TemplateApplierController {

  constructor(
    private readonly applier: TemplateApplier,
    private readonly versionService: TemplateVersionService,
    private readonly transcriptionService: TranscriptionService,
  ) { }

  @Post()
  async applyVersion(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body(new ZodValidationPipe(applyTemplateSchema)) apply: ApplyTemplateDTO,
  ): Promise<AppliedTemplateDTO> {
    const version = await this.versionService.findById(
      user,
      templateId,
      versionId,
    );

    const transcription = await this.transcriptionService.findById(
      user,
      apply.meetingId,
      apply.recordingId,
      apply.transcriptionId,
    );

    const output = await this.applier.apply(version, transcription, user);

    return {
      templateVersionId: version.id,
      transcriptionId: transcription.id,
      output,
    };
  }
}
