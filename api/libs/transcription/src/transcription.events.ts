import type { RecordingDTO, TranscriptionDTO } from '@akouo/contract';
import type { Actor } from '@aether-zone/organon';


/**
 * Emitted once a recording's transcription — and the utterances under it — are
 * stored. The counterpart to `recording.stored`: that one says there is audio,
 * this one says there are words.
 */
export const RECORDING_TRANSCRIBED_EVENT = 'recording.transcribed';

export class RecordingTranscribedEvent {
    constructor(
        public readonly transcription: TranscriptionDTO,
        public readonly recording: RecordingDTO,
        public readonly meetingId: string,
        /**
         * Whose transcription this is. Carried because a listener acting on it
         * reaches resources that are checked against their owner, and there is no
         * request left to take one from by the time this is emitted.
         */
        public readonly user: Actor,
    ) { }
}
