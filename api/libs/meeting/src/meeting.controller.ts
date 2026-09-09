import { MeetingDTO, createMeetingSchema, updateMeetingSchema } from '@akouo/contract';
import type { CreateMeetingDTO, UpdateMeetingDTO } from '@akouo/contract';
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

import { MeetingService } from './meeting.service';

@Controller('organizations/:organizationId/meetings')
@UseGuards(OrganizationGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  getMeetings(@CurrentActor() user: Actor): Promise<MeetingDTO[]> {
    return this.meetingService.findAll(user);
  }

  @Get('/:id')
  getMeeting(
    @CurrentActor() user: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MeetingDTO> {
    return this.meetingService.findById(user, id);
  }

  @Post()
  createMeeting(
    @CurrentActor() user: Actor,
    @Body(new ZodValidationPipe(createMeetingSchema)) meeting: CreateMeetingDTO,
  ): Promise<MeetingDTO> {
    return this.meetingService.create(user, meeting);
  }

  /** Editing a meeting: only the fields that are sent move. */
  @Put('/:id')
  updateMeeting(
    @CurrentActor() user: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateMeetingSchema)) meeting: UpdateMeetingDTO,
  ): Promise<MeetingDTO> {
    return this.meetingService.updateMeeting(user, id, meeting);
  }

  @Delete('/:id')
  deleteMeeting(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.meetingService.delete(user, id);
  }
}
