import { Module } from '@nestjs/common';

import { MeetingService } from './meeting.service';
import { MeetingMapper } from './meeting.mapper';
import { meetingProviders } from './meeting.providers';
import { MeetingController } from './meeting.controller';
import { ParticipantMapper } from './participant/participant.mapper';
import { EventListener } from './event.listener';
import { MeetingListener } from './meeting.listener';
import { MeetingProjectionService } from './meeting.projection';
import { LocationModule } from '@akouo/location';

// Nothing from `@akouo/recording` is needed here: a meeting no longer carries its
// recordings, so the dependency runs one way — recordings know their meeting.
@Module({
  /*
   * A meeting resolves its location through `LocationService`. One direction
   * only: `LocationModule` knows nothing about meetings, so this is not the
   * cycle `PersonModule` -> `MeetingModule` already is.
   */
  imports: [LocationModule],
  providers: [
    ...meetingProviders,
    MeetingService,
    MeetingMapper,
    ParticipantMapper,
    MeetingListener,
    MeetingProjectionService,
    EventListener,
  ],
  controllers: [MeetingController],
  // `ParticipantMapper` is exported for the transcription library, where an
  // utterance carries the participant it is attributed to.
  exports: [MeetingService, ParticipantMapper],
})
export class MeetingModule {}
