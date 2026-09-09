"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiDelete } from "@/lib/api";
import {
    getTranscriptions,
    updateUtterance,
    type UtteranceLocation,
} from "@/lib/transcriptions";

export type DeleteMeetingState = { error?: string };

export type DeleteRecordingResult = { ok: true } | { ok: false; error: string };

/**
 * Removes a recording, which takes its transcriptions and their utterances with
 * it — the API cascades, and the object in storage goes too.
 */
export async function deleteRecording(
    meetingId: string,
    recordingId: string
): Promise<DeleteRecordingResult> {
    if (!meetingId || !recordingId) {
        return { ok: false, error: "Could not delete this recording." };
    }

    const result = await apiDelete(
        `/meetings/${encodeURIComponent(meetingId)}/recordings/${encodeURIComponent(recordingId)}`
    );

    if (!result.ok) {
        return {
            ok: false,
            error:
                result.reason === "notFound"
                    ? "That recording no longer exists."
                    : "Could not delete this recording. Try again.",
        };
    }

    revalidatePath(`/meetings/${meetingId}`);

    return { ok: true };
}

export type UtteranceEditResult = { ok: true } | { ok: false; error: string };

/** Corrects the words of one turn. */
export async function saveUtteranceContent(
    location: UtteranceLocation,
    utteranceId: string,
    content: string
): Promise<UtteranceEditResult> {
    const trimmed = content.trim();

    if (!trimmed) {
        return { ok: false, error: "An utterance cannot be empty." };
    }

    const result = await updateUtterance(location, utteranceId, {
        content: trimmed,
    });

    if (!result.ok) {
        return {
            ok: false,
            error: result.body?.message ?? "Could not save this change.",
        };
    }

    revalidatePath(`/meetings/${location.meetingId}`);

    return { ok: true };
}

/**
 * Attributes a turn to a participant — or, with `scope: "speaker"`, every turn
 * the transcriber gave the same label, which is the usual case: diarization
 * separates voices without naming them, so naming one names all of them.
 *
 * Which turns those are is worked out here rather than taken from the caller, so
 * the answer comes from the transcription itself.
 */
export async function linkUtteranceParticipant(
    location: UtteranceLocation,
    utteranceId: string,
    participantId: string | null,
    scope: "utterance" | "speaker"
): Promise<UtteranceEditResult & { updated?: number }> {
    let targets = [utteranceId];

    if (scope === "speaker") {
        const transcriptions = await getTranscriptions(
            location.meetingId,
            location.recordingId
        );

        if (!transcriptions.ok) {
            return { ok: false, error: "Could not read the transcription." };
        }

        const utterances =
            transcriptions.data.find(
                (transcription) => transcription.id === location.transcriptionId
            )?.utterances ?? [];

        const speakerLabel = utterances.find(
            (utterance) => utterance.id === utteranceId
        )?.speakerLabel;

        if (speakerLabel) {
            targets = utterances
                .filter(
                    (utterance) =>
                        utterance.id && utterance.speakerLabel === speakerLabel
                )
                .map((utterance) => utterance.id!);
        }
    }

    const results = await Promise.all(
        targets.map((id) => updateUtterance(location, id, { participantId }))
    );

    const failed = results.filter((result) => !result.ok).length;

    revalidatePath(`/meetings/${location.meetingId}`);

    if (failed === results.length) {
        return { ok: false, error: "Could not link this participant." };
    }
    if (failed > 0) {
        return {
            ok: false,
            error: `Linked ${results.length - failed} of ${results.length} lines; the rest failed.`,
        };
    }

    return { ok: true, updated: results.length };
}

export async function deleteMeeting(id: string): Promise<DeleteMeetingState> {
    if (!id) {
        return { error: "Could not delete this meeting." };
    }

    const result = await apiDelete(`/meetings/${encodeURIComponent(id)}`);

    if (!result.ok) {
        return {
            error:
                result.reason === "notFound"
                    ? "That meeting no longer exists."
                    : "Could not delete this meeting. Try again.",
        };
    }

    // The list and the dashboard counts both change.
    revalidatePath("/meetings");
    revalidatePath("/");

    // Throws NEXT_REDIRECT, so keep it outside any try/catch.
    redirect("/meetings");
}
