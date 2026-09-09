

/**
 * DI token for {@link Transcriber}. An interface has no runtime value to inject
 * against, so implementations are registered under this instead.
 */
import { MeetingDTO } from '@akouo/contract';
import type { CreateUtteranceDTO, RecordingDTO } from '@akouo/contract';
export const TRANSCRIBER = 'TRANSCRIBER';

/**
 * Turns a recording into text. What sits behind this — a local model, a hosted
 * API, the mock — is the module's choice; nothing calling it needs to know.
 */
export interface Transcriber {
    /**
     * The transcript of the recording's audio. Takes the DTO rather than the file
     * itself: an implementation reads the bytes it needs through the file id on
     * `recording.file`, and a remote one may never read them here at all.
     */
    transcribe(recording: RecordingDTO, meeting: MeetingDTO): Promise<TranscriptionResult>;
}

/**
 * What a transcriber produces: the whole transcript as text, and — from one that
 * separates speakers — the same words as turns.
 *
 * The turns come back rather than being written here, because each one points at a
 * transcription row that does not exist until the transcript is saved. Storing them
 * is `TranscriptionService.create`, in the same step that creates it.
 */
export interface TranscriptionResult {
    content: string;
    /** Empty from a transcriber that does not separate speakers. */
    utterances: CreateUtteranceDTO[];
}
