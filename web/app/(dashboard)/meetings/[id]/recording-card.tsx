"use client";

import { Alert, AlertDescription, Button, Card, CardContent, EmptyState, Select, Text } from "@aether-zone/kosmos";
import { AudioPlayer } from "@akouo/ui";
import { useState } from "react";

import { UploadRecordingDialog } from "../upload-recording-dialog";
import { DeleteRecordingButton } from "./delete-recording-button";

import {
    Utterance,
    type TranscriptionUtterance,
    type UtteranceParticipant,
} from "./utterance";

export type MeetingTranscription = {
    id: string;
    label: string;
    /** In the order they were spoken. */
    utterances: TranscriptionUtterance[];
};

/** Display-ready: the page formats sizes and dates, this only lays them out. */
export type MeetingRecording = {
    id: string;
    name: string;
    size: string;
    createdAt: string;
    streamUrl: string;
    /** Oldest first, labelled with the date they were made. */
    transcriptions: MeetingTranscription[];
};

/**
 * The meeting's audio: one recording at a time, with its transcription under it.
 *
 * One card rather than one per recording, because a meeting almost always has a
 * single one — the pickers are what keep the rare extras reachable, and each is
 * shown only when there is something to choose between.
 */
export function RecordingCard({
    meetingId,
    recordings = [],
    participants = [],
}: {
    meetingId: string;
    recordings?: MeetingRecording[];
    /** The meeting's participants, to attribute a turn to one of them. */
    participants?: UtteranceParticipant[];
}) {
    const [selectedRecordingId, setSelectedRecordingId] = useState(
        recordings[0]?.id ?? ""
    );
    const [selectedTranscriptionId, setSelectedTranscriptionId] = useState("");
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Falls back to the first: the selection is by id, and the list can change
    // under it when the page revalidates after an upload or a delete.
    const selectedRecording =
        recordings.find((recording) => recording.id === selectedRecordingId) ??
        recordings[0];

    // Same fallback, which is also what moves the selection to the new
    // recording's first transcription when the recording above it changes.
    const transcriptions = selectedRecording?.transcriptions ?? [];
    const selectedTranscription =
        transcriptions.find(
            (transcription) => transcription.id === selectedTranscriptionId
        ) ?? transcriptions[0];

    if (!selectedRecording) {
        return (
            <EmptyState
                title="No recordings"
                description="Attach an audio recording to this meeting to have it transcribed."
                action={
                    // The meeting exists, so the dialog asks for the file alone.
                    <UploadRecordingDialog
                        meeting={{ id: meetingId }}
                        trigger={(open) => (
                            <Button type="button" onClick={open}>
                                Upload recording
                            </Button>
                        )}
                    />
                }
            />
        );
    }

    return (
        <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
                {deleteError && (
                    <Alert variant="destructive">
                        <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* With nothing to choose between, the picker would be a
                        control that cannot do anything, so the name stands in
                        its place. */}
                    {recordings.length > 1 ? (
                        <div className="w-full sm:max-w-xs">
                            <Select
                                aria-label="Recording"
                                value={selectedRecording.id}
                                onChange={(event) =>
                                    setSelectedRecordingId(event.target.value)
                                }
                            >
                                {recordings.map((recording) => (
                                    <option
                                        key={recording.id}
                                        value={recording.id}
                                    >
                                        {recording.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    ) : (
                        <p className="min-w-0 truncate text-sm font-medium text-foreground">
                            {selectedRecording.name}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <Text tone="muted" size="body-small">
                            {selectedRecording.size} · Added{" "}
                            {selectedRecording.createdAt}
                        </Text>
                        <DeleteRecordingButton
                            meetingId={meetingId}
                            recordingId={selectedRecording.id}
                            name={selectedRecording.name}
                            onError={setDeleteError}
                        />
                    </div>
                </div>

                {/* Keyed by recording, so switching starts a fresh player rather
                    than carrying the last one's position and play state over.
                    The audio is fetched through our own route, which attaches
                    the session's token. */}
                <AudioPlayer
                    key={selectedRecording.id}
                    src={selectedRecording.streamUrl}
                />

                {selectedTranscription ? (
                    <>
                        {/* As with the recording above: one transcription needs
                            naming, not choosing between. */}
                        {transcriptions.length > 1 ? (
                            <div className="w-full sm:max-w-xs">
                                <Select
                                    aria-label="Transcription"
                                    value={selectedTranscription.id}
                                    onChange={(event) =>
                                        setSelectedTranscriptionId(
                                            event.target.value
                                        )
                                    }
                                >
                                    {transcriptions.map((transcription) => (
                                        <option
                                            key={transcription.id}
                                            value={transcription.id}
                                        >
                                            {transcription.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        ) : (
                            <Text tone="muted" size="body-small">
                                {selectedTranscription.label}
                            </Text>
                        )}

                        {selectedTranscription.utterances.length === 0 ? (
                            <Text tone="muted" size="body-small">
                                This transcription has no separated turns.
                            </Text>
                        ) : (
                            <ol className="flex flex-col gap-3">
                                {selectedTranscription.utterances.map(
                                    (utterance) => (
                                        <Utterance
                                            key={utterance.id}
                                            utterance={utterance}
                                            location={{
                                                meetingId,
                                                recordingId:
                                                    selectedRecording.id,
                                                transcriptionId:
                                                    selectedTranscription.id,
                                            }}
                                            participants={participants}
                                        />
                                    )
                                )}
                            </ol>
                        )}
                    </>
                ) : (
                    <Text tone="muted" size="body-small">
                        No transcription yet.
                    </Text>
                )}
            </CardContent>
        </Card>
    );
}
