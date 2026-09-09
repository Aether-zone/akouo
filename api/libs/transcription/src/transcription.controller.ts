import { TranscriptionDTO, createTranscriptionSchema, updateTranscriptionSchema } from '@akouo/contract';
import type { CreateTranscriptionDTO, UpdateTranscriptionDTO } from '@akouo/contract';
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

import { TranscriptionService } from './transcription.service';

@Controller('organizations/:organizationId/meetings/:meetingId/recordings/:recordingId/transcriptions')
@UseGuards(OrganizationGuard)
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Get()
  getTranscriptions(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('recordingId', ParseUUIDPipe) recordingId: string,
  ): Promise<TranscriptionDTO[]> {
    return this.transcriptionService.findAll(user, meetingId, recordingId);
  }

  @Get('/:id')
  getTranscription(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('recordingId', ParseUUIDPipe) recordingId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TranscriptionDTO> {
    return this.transcriptionService.findById(user, meetingId, recordingId, id);
  }

  @Post()
  createTranscription(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('recordingId', ParseUUIDPipe) recordingId: string,
    @Body(new ZodValidationPipe(createTranscriptionSchema))
    transcription: CreateTranscriptionDTO,
  ): Promise<TranscriptionDTO> {
    return this.transcriptionService.create(
      user,
      meetingId,
      recordingId,
      transcription,
    );
  }

  /** Correcting the text, which marks the transcription `MANUAL`. */
  @Put('/:id')
  updateTranscription(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('recordingId', ParseUUIDPipe) recordingId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTranscriptionSchema))
    transcription: UpdateTranscriptionDTO,
  ): Promise<TranscriptionDTO> {
    return this.transcriptionService.update(
      user,
      meetingId,
      recordingId,
      id,
      transcription,
    );
  }

  @Delete('/:id')
  deleteTranscription(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('recordingId', ParseUUIDPipe) recordingId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.transcriptionService.delete(user, meetingId, recordingId, id);
  }
}
