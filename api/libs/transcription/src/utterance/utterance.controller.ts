import { updateUtteranceSchema } from '@akouo/contract';
import type { UpdateUtteranceDTO, UtteranceDTO } from '@akouo/contract';
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import { ZodValidationPipe } from '@akouo/common';

import { UtteranceService } from './utterance.service';

/**
 * Utterances are addressed under the transcription that holds them, which is also
 * where the caller's access to them comes from — an utterance carries no owner of
 * its own. {@link UtteranceService} checks that in the same query that loads it.
 */
@Controller(
  'organizations/:organizationId/meetings/:meetingId/recordings/:recordingId/transcriptions/:transcriptionId/utterances',
)
@UseGuards(OrganizationGuard)
export class UtteranceController {
  constructor(private readonly utteranceService: UtteranceService) {}

  /** Correcting one turn, which marks that utterance `MANUAL`. */
  @Put('/:id')
  updateUtterance(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('recordingId', ParseUUIDPipe) recordingId: string,
    @Param('transcriptionId', ParseUUIDPipe) transcriptionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUtteranceSchema))
    utterance: UpdateUtteranceDTO,
  ): Promise<UtteranceDTO> {
    return this.utteranceService.update(
      user,
      recordingId,
      transcriptionId,
      id,
      utterance,
    );
  }
}
