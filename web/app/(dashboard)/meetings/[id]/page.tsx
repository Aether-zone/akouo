import { notFound } from "next/navigation";

import { formatBytes } from "@/lib/format";
import { formatMeetingDate, formatMeetingDateLong } from "@/lib/datetime";
import { getMeeting } from "@/lib/meetings";
import { getPersons, namesByPersonId } from "@/lib/persons";
import { recordingStreamUrl } from "@/lib/recordings";
import { getRecordings } from "@/lib/recordings.server";
import { getTranscriptions } from "@/lib/transcriptions";

import { MeetingDetailView } from "./meeting-detail-view";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getMeeting(id);
    const title = result.ok ? result.data.title : undefined;
    return { title: title ? `${title} — Akouo` : "Meeting — Akouo" };
}

export default async function MeetingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getMeeting(id);

    if (!result.ok) {
        if (result.reason === "notFound") {
            notFound();
        }
        return <MeetingDetailView unavailable />;
    }

    const meeting = result.data;

    // Participant rows carry only `personId`, so resolve names from /persons.
    // A failure here degrades to showing the raw ids rather than the page.
    const personsResult = await getPersons();
    const names = personsResult.ok
        ? namesByPersonId(personsResult.data)
        : new Map<string, string>();

    const participants = (meeting.participants ?? []).map((participant) => ({
        key: participant.id ?? participant.personId ?? "",
        personId: participant.personId,
        name: participant.personId
            ? (names.get(participant.personId) ?? "Unknown person")
            : "Unknown person",
    }));

    const meetingId = meeting.id ?? id;

    /*
     * Recordings are their own resource now — the meeting response no longer
     * carries them. A failure here leaves the page without its player rather than
     * without the meeting.
     */
    const recordingsResult = await getRecordings(meetingId);

    // A recording with no id cannot be streamed, so it is not worth a player.
    const storedRecordings = (
        recordingsResult.ok ? recordingsResult.data : []
    ).filter((recording) => recording.id);

    /*
     * Transcriptions are not part of the meeting response, so they are fetched per
     * recording — in parallel, and a failure on one leaves that recording without a
     * transcription list rather than taking the page down with it.
     */
    const transcriptionsByRecording = await Promise.all(
        storedRecordings.map(async (recording) => {
            const result = await getTranscriptions(meetingId, recording.id!);
            return result.ok ? result.data : [];
        })
    );

    const recordings = storedRecordings.map((recording, index) => ({
        id: recording.id!,
        name: recording.file?.originalName ?? "Recording",
        size: formatBytes(recording.file?.size ?? 0),
        createdAt: formatMeetingDate(recording.createdAt),
        streamUrl: recordingStreamUrl(meetingId, recording.id!),
        transcriptions: (transcriptionsByRecording[index] ?? [])
            .filter((transcription) => transcription.id)
            .map((transcription) => ({
                id: transcription.id!,
                label: `Transcription (${formatMeetingDate(transcription.createdAt)})`,
                utterances: (transcription.utterances ?? [])
                    .filter((utterance) => utterance.id)
                    .map((utterance) => {
                        const personId = utterance.participant?.personId;
                        const diarizationLabel = utterance.speakerLabel ?? "?";

                        return {
                            id: utterance.id!,
                            /*
                             * Once a turn is attributed, the person behind the
                             * participant is the speaker — the letter diarization
                             * gave the voice only stands in until then.
                             */
                            speakerLabel: personId
                                ? (names.get(personId) ?? "Unknown person")
                                : `Speaker ${diarizationLabel}`,
                            diarizationLabel,
                            participantId: utterance.participant?.id ?? null,
                            startMs: utterance.start ?? 0,
                            text: utterance.content ?? "",
                        };
                    }),
            })),
    }));

    // Only rows with an id can be attributed to; the id is what an utterance stores.
    const linkableParticipants = (meeting.participants ?? [])
        .filter((participant) => participant.id)
        .map((participant) => ({
            id: participant.id!,
            name: participant.personId
                ? (names.get(participant.personId) ?? "Unknown person")
                : "Unknown person",
        }));

    return (
        <MeetingDetailView
            id={meetingId}
            title={meeting.title ?? "Untitled meeting"}
            startDate={formatMeetingDateLong(meeting.startDate)}
            createdAt={formatMeetingDate(meeting.createdAt)}
            status={meeting.status}
            startDateValue={meeting.startDate}
            persons={personsResult.ok ? personsResult.data : []}
            recordings={recordings}
            participants={participants}
            linkableParticipants={linkableParticipants}
        />
    );
}
