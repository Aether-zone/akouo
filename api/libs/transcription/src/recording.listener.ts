import { CreateTranscriptionDTO, TranscriptionDTO } from '@akouo/contract';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
    RECORDING_STORED_EVENT,
    RecordingStoredEvent,
} from '@akouo/recording';

import { TRANSCRIBER, type Transcriber } from './transcriber';
import { TranscriptionService } from './transcription.service';
import {
    RECORDING_TRANSCRIBED_EVENT,
    RecordingTranscribedEvent,
} from './transcription.events';

/**
 * Transcribes a recording once it has been stored.
 *
 * The listener is how transcription hangs off an upload without the recording
 * library knowing this one exists — it emits, and whoever cares reacts.
 */
@Injectable()
export class RecordingListener {
    private readonly logger = new Logger(RecordingListener.name);

    constructor(
        @Inject(TRANSCRIBER) private readonly transcriber: Transcriber,
        private readonly transcriptionService: TranscriptionService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    /**
     * Failures are logged rather than thrown: the upload has already succeeded and
     * been answered, so there is no request left to fail, and an unhandled rejection
     * out of a listener would take the process down instead.
     */
    @OnEvent(RECORDING_STORED_EVENT)
    async onRecordingStored(event: RecordingStoredEvent): Promise<void> {
        const { recording, meeting, user } = event;

        try {
            const transcript = await this.transcriber.transcribe(recording, meeting);

            this.logger.log(
                `Transcribed recording "${recording.id}" (${transcript.content.length} characters, ${transcript.utterances.length} utterances)`,
            );

            const transcription: CreateTranscriptionDTO = {
                content: transcript.content,
                utterances: transcript.utterances
            }

            const createdTranscription: TranscriptionDTO = await this.transcriptionService.create(user, recording.meetingId, recording.id, transcription)

            this.logger.log(
                `Stored transcription "${createdTranscription.id}" for recording "${recording.id}"`,
            );

            // Only once the transcription and its utterances are written, so a
            // listener acting on this can read them back.
            this.eventEmitter.emit(
                RECORDING_TRANSCRIBED_EVENT,
                new RecordingTranscribedEvent(
                    createdTranscription,
                    recording,
                    recording.meetingId,
                    user,
                ),
            );
        } catch (error) {
            this.logger.error(
                `Failed to transcribe recording "${recording.id}"`,
                error,
            );
        }
    }
}
