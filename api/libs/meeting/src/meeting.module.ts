import { Module } from '@nestjs/common';

import { MeetingService } from './meeting.service';
import { MeetingMapper } from './meeting.mapper';
import { meetingProviders } from './meeting.providers';
import { MeetingController } from './meeting.controller';
import { ParticipantMapper } from './participant/participant.mapper';
import { MeetingListener } from './meeting.listener';

// Nothing from `@akouo/recording` is needed here: a meeting no longer carries its
// recordings, so the dependency runs one way — recordings know their meeting.
@Module({
  providers: [
    ...meetingProviders,
    MeetingService,
    MeetingMapper,
    ParticipantMapper,
    MeetingListener,
  ],
  controllers: [MeetingController],
  // `ParticipantMapper` is exported for the transcription library, where an
  // utterance carries the participant it is attributed to.
  exports: [MeetingService, ParticipantMapper],
})
export class MeetingModule {}
