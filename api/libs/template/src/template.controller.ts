import { TemplateDTO, createTemplateSchema, updateTemplateSchema } from '@akouo/contract';
import type { CreateTemplateDTO, UpdateTemplateDTO } from '@akouo/contract';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import { ZodValidationPipe } from '@akouo/common';

import { TemplateService } from './template.service';

@Controller('organizations/:organizationId/templates')
@UseGuards(OrganizationGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  getTemplates(@CurrentActor() user: Actor): Promise<TemplateDTO[]> {
    return this.templateService.findAll(user);
  }

  @Get('/:id')
  getTemplate(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TemplateDTO> {
    return this.templateService.findById(user, id);
  }

  @Post()
  createTemplate(
    @CurrentActor() user: Actor,
    @Body(new ZodValidationPipe(createTemplateSchema))
    template: CreateTemplateDTO,
  ): Promise<TemplateDTO> {
    return this.templateService.create(user, template);
  }

  /** Editing one: only the fields that are sent move. */
  @Put('/:id')
  updateTemplate(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTemplateSchema))
    template: UpdateTemplateDTO,
  ): Promise<TemplateDTO> {
    return this.templateService.update(user, id, template);
  }

  @Delete('/:id')
  deleteTemplate(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.templateService.delete(user, id);
  }
}
