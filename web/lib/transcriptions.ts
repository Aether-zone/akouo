import { apiGet, apiPut, type ApiPostFailure, type ApiResult } from "./api";

/**
 * A transcription of one recording. `origin` is `TRANSCRIBED` while it is as the
 * transcriber wrote it, and `MANUAL` once a person has corrected it.
 *
 * Utterances are the same words split into turns; they come back with the
 * transcription and are typed loosely here until something renders them.
 */
export type Utterance = {
    id?: string;
    transcriptionId?: string;
    speakerLabel?: string;
    participant?: { id?: string; personId?: string; meetingId?: string } | null;
    content?: string;
    confidence?: number;
    start?: number;
    end?: number;
    origin?: "TRANSCRIBED" | "MANUAL";
};

export type Transcription = {
    id?: string;
    recordingId?: string;
    content?: string;
    origin?: "TRANSCRIBED" | "MANUAL";
    utterances?: Utterance[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
};

/**
 * A recording's transcriptions, oldest first — the API orders them by creation,
 * so the first is the one that came out of the original transcription run.
 */
export function getTranscriptions(
    meetingId: string,
    recordingId: string
): Promise<ApiResult<Transcription[]>> {
    return apiGet<Transcription[]>(
        `/meetings/${encodeURIComponent(meetingId)}/recordings/${encodeURIComponent(recordingId)}/transcriptions`
    );
}

export type UtteranceLocation = {
    meetingId: string;
    recordingId: string;
    transcriptionId: string;
};

/**
 * Corrects one turn. Only what is sent changes, and the API marks whatever it
 * touches as `MANUAL` — `participantId: null` takes an attribution off again,
 * which is why it is sent explicitly rather than omitted.
 */
export function updateUtterance(
    location: UtteranceLocation,
    utteranceId: string,
    update: { content?: string; participantId?: string | null }
): Promise<{ ok: true; data: Utterance } | ApiPostFailure> {
    const { meetingId, recordingId, transcriptionId } = location;

    return apiPut<Utterance>(
        `/meetings/${encodeURIComponent(meetingId)}/recordings/${encodeURIComponent(recordingId)}` +
            `/transcriptions/${encodeURIComponent(transcriptionId)}/utterances/${encodeURIComponent(utteranceId)}`,
        update
    );
}
