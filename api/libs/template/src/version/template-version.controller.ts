import { createTemplateVersionSchema } from '@akouo/contract';
import type { CreateTemplateVersionDTO, TemplateVersionDTO } from '@akouo/contract';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import { ZodValidationPipe } from '@akouo/common';

import { TemplateVersionService } from './template-version.service';

/**
 * Versions are addressed under the template they belong to, which is also where
 * the caller's access to them comes from.
 */
@Controller('organizations/:organizationId/templates/:templateId/versions')
@UseGuards(OrganizationGuard)
export class TemplateVersionController {
  constructor(private readonly versionService: TemplateVersionService) {}

  @Get()
  getVersions(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ): Promise<TemplateVersionDTO[]> {
    return this.versionService.findAll(user, templateId);
  }

  @Get('/:id')
  getVersion(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TemplateVersionDTO> {
    return this.versionService.findById(user, templateId, id);
  }

  /** Snapshots the template as it stands, or the content sent instead. */
  @Post()
  createVersion(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body(new ZodValidationPipe(createTemplateVersionSchema))
    version: CreateTemplateVersionDTO,
  ): Promise<TemplateVersionDTO> {
    return this.versionService.create(user, templateId, version);
  }

  /** Makes this the published version, and the previous one a draft again. */
  @Post('/:id/publish')
  publishVersion(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TemplateVersionDTO> {
    return this.versionService.publish(user, templateId, id);
  }

  /** Puts this version's wording back on the template. */
  @Post('/:id/restore')
  restoreVersion(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TemplateVersionDTO> {
    return this.versionService.restore(user, templateId, id);
  }

  @Delete('/:id')
  deleteVersion(
    @CurrentActor() user: Actor,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.versionService.delete(user, templateId, id);
  }
}
