import { MEETING_STATUSES } from '@akouo/contract';
import type { MeetingStatus } from '@akouo/contract';
import { Injectable, Logger } from '@nestjs/common';
import type { Actor } from '@aether-zone/organon';
import { OnEvent } from '@nestjs/event-emitter';

// Type-only, and erased at compile time: both libraries already depend on this
// one, so neither may be required back. The event names are written out here for
// the same reason — importing the constants would be a runtime edge in the wrong
// direction.
import type { RecordingStoredEvent } from '@akouo/recording';
import type { RecordingTranscribedEvent } from '@akouo/transcription';

import { MeetingService } from './meeting.service';

/** Mirrors `RECORDING_STORED_EVENT` in `@akouo/recording`. */
const RECORDING_STORED_EVENT = 'recording.stored';

/** Mirrors `RECORDING_TRANSCRIBED_EVENT` in `@akouo/transcription`. */
const RECORDING_TRANSCRIBED_EVENT = 'recording.transcribed';

/**
 * Moves a meeting on as things happen to it: `INITIAL` while it is only
 * scheduled, `RECORDED` once there is audio against it, `TRANSCRIBED` once there
 * are words.
 *
 * Only ever forwards. Uploading a second recording to a transcribed meeting is
 * not a reason to say it has no transcript, and events can arrive in any order.
 */
@Injectable()
export class MeetingListener {
  private readonly logger = new Logger(MeetingListener.name);

  constructor(private readonly meetingService: MeetingService) {}

  /**
   * Failures are logged rather than thrown: the upload has already succeeded and
   * been answered, so there is no request left to fail, and an unhandled rejection
   * out of a listener would take the process down instead.
   */
  @OnEvent(RECORDING_STORED_EVENT)
  async onRecordingStored(event: RecordingStoredEvent): Promise<void> {
    const { recording, user } = event;

    await this.advance(user, recording.meetingId, 'RECORDED', `recording "${recording.id}"`);
  }

  @OnEvent(RECORDING_TRANSCRIBED_EVENT)
  async onRecordingTranscribed(event: RecordingTranscribedEvent): Promise<void> {
    const { transcription, meetingId, user } = event;

    await this.advance(
      user,
      meetingId,
      'TRANSCRIBED',
      `transcription "${transcription.id}"`,
    );
  }

  /**
   * Reads the meeting first — which is also what proves the caller still owns it
   * — and writes only when the new status is further along than the one it has.
   */
  private async advance(
    user: Actor,
    meetingId: string,
    status: MeetingStatus,
    because: string,
  ): Promise<void> {
    try {
      const meeting = await this.meetingService.findById(user, meetingId);

      if (MEETING_STATUSES.indexOf(status) <= MEETING_STATUSES.indexOf(meeting.status)) {
        return;
      }

      await this.meetingService.updateMeeting(user, meeting.id, { status });

      this.logger.log(`Meeting "${meeting.id}" marked ${status} after ${because}`);
    } catch (error) {
      this.logger.error(
        `Failed to mark meeting "${meetingId}" as ${status}`,
        error,
      );
    }
  }
}
