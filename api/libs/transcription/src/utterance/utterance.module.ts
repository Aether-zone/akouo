import { Module } from '@nestjs/common';

import { MeetingModule } from '@akouo/meeting';

import { UtteranceService } from './utterance.service';
import { UtteranceMapper } from './utterance.mapper';
import { utteranceProviders } from './utterance.providers';
import { UtteranceController } from './utterance.controller';

/**
 * Utterances belong to a transcription and are only ever reached through one, so
 * this module's routes are nested under it — while the service and mapper are
 * exported for `TranscriptionModule`, which writes and reads them as part of a
 * transcription.
 */
@Module({
  // For `ParticipantMapper`: an utterance carries the participant it is attributed
  // to, and that mapper is the one place a participant becomes a DTO.
  imports: [MeetingModule],
  providers: [...utteranceProviders, UtteranceService, UtteranceMapper],
  controllers: [UtteranceController],
  exports: [UtteranceService, UtteranceMapper],
})
export class UtteranceModule {}
