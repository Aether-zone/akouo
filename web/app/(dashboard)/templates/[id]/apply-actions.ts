"use server";

import { getRecordings } from "@/lib/recordings.server";
import { applyTemplateVersion } from "@/lib/templates";
import { getTranscriptions } from "@/lib/transcriptions";

export type Option = { value: string; label: string };

/**
 * The modal narrows meeting → recording → transcription, and only the meetings
 * are known when it opens. These two are how it fills the rest in as it goes,
 * rather than the page loading every recording of every meeting up front.
 */
export async function recordingOptions(meetingId: string): Promise<Option[]> {
    const result = await getRecordings(meetingId);

    if (!result.ok) {
        return [];
    }

    return result.data
        .filter((recording) => recording.id)
        .map((recording) => ({
            value: recording.id!,
            label: recording.file?.originalName ?? "Recording",
        }));
}

export async function transcriptionOptions(
    meetingId: string,
    recordingId: string
): Promise<Option[]> {
    const result = await getTranscriptions(meetingId, recordingId);

    if (!result.ok) {
        return [];
    }

    return result.data
        .filter((transcription) => transcription.id)
        .map((transcription) => ({
            value: transcription.id!,
            label: `Transcription (${transcription.utterances?.length ?? 0} turns)`,
        }));
}

export type ApplyResult =
    | { ok: true; output: unknown }
    | { ok: false; error: string };

export async function applyVersion(
    templateId: string,
    versionId: string,
    target: { meetingId: string; recordingId: string; transcriptionId: string }
): Promise<ApplyResult> {
    const result = await applyTemplateVersion(templateId, versionId, target);

    if (!result.ok) {
        return {
            ok: false,
            error: result.body?.message ?? "Could not apply this template.",
        };
    }

    return { ok: true, output: result.data.output ?? null };
}
