import { MeetingDTO } from '@akouo/contract';
import type { RecordingDTO } from '@akouo/contract';
import { Injectable, Logger } from '@nestjs/common';


import type { Transcriber, TranscriptionResult } from './transcriber';

/**
 * Stand-in {@link Transcriber} for tests and for running without an API key: it
 * describes the recording it was given, without reading a byte of audio.
 *
 * It is deliberately deterministic and instant — the point is that everything
 * around transcription can be exercised end to end without the network.
 */
@Injectable()
export class MockTranscriber implements Transcriber {
    private readonly logger = new Logger(MockTranscriber.name);

    /*
     * `_meeting` is part of the {@link Transcriber} contract; this mock
     * describes the file it was handed and has no use for the meeting.
     */
    transcribe(recording: RecordingDTO, _meeting: MeetingDTO): Promise<TranscriptionResult> {
        this.logger.log(`Mock transcribing recording "${recording.id}"`);

        const { originalName, size, mimeType } = recording.file;
        const opening = `Mock transcript of ${originalName} (${size} bytes, ${mimeType}).`;
        const reply = 'Two speakers, so the utterances have something to divide.';

        return Promise.resolve({
            content: `${opening} ${reply}`,
            utterances: [
                {
                    speakerLabel: 'A',
                    participantId: null,
                    content: opening,
                    confidence: 1,
                    start: 0,
                    end: 1000,
                },
                {
                    speakerLabel: 'B',
                    participantId: null,
                    content: reply,
                    confidence: 1,
                    start: 1000,
                    end: 2000,
                },
            ],
        });
    }
}
