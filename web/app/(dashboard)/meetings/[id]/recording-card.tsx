"use client";

import { Alert, AlertDescription, Badge, Button, Card, CardContent, EmptyState, Select, Text } from "@aether-zone/kosmos";
import type { FileStatus } from "@/lib/recordings";
import type { ContentOrigin } from "@/lib/transcriptions";
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
    /**
     * Whether anyone has corrected it: `TRANSCRIBED` is as the transcriber
     * wrote it, `MANUAL` once a person edited it through the API.
     *
     * Shown because it is what a reader needs in order to decide how much to
     * trust a line — a machine's guess and a human's correction read
     * identically otherwise.
     */
    origin: ContentOrigin;
    /** In the order they were spoken. */
    utterances: TranscriptionUtterance[];
};

/** How each origin reads, and how much it should stand out. */
const ORIGIN_BADGES: Record<
    ContentOrigin,
    { label: string; variant: "secondary" | "success"; title: string }
> = {
    TRANSCRIBED: {
        label: "As transcribed",
        variant: "secondary",
        title: "Exactly as the transcriber produced it. Nobody has corrected it.",
    },
    MANUAL: {
        label: "Corrected",
        variant: "success",
        title: "A person has edited this transcript since it was produced.",
    },
};

/** Display-ready: the page formats sizes and dates, this only lays them out. */
export type MeetingRecording = {
    id: string;
    name: string;
    size: string;
    createdAt: string;
    streamUrl: string;
    /**
     * How far the upload got. Optional because an older api may not say, and
     * claiming "ready" on silence would be the one wrong guess to make.
     */
    status?: FileStatus;
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
                        <RecordingStatus status={selectedRecording.status} />
                        <DeleteRecordingButton
                            meetingId={meetingId}
                            recordingId={selectedRecording.id}
                            name={selectedRecording.name}
                            onError={setDeleteError}
                        />
                    </div>
                </div>

                {selectedRecording.status &&
                selectedRecording.status !== "UPLOADED" ? (
                    /*
                     * No player for something the api will not serve: it
                     * refuses anything that is not `UPLOADED`, so the controls
                     * would sit there and fail on press. Saying why is more
                     * use than a button that cannot work.
                     */
                    <Alert>
                        <AlertDescription>
                            {STATUS_BADGES[selectedRecording.status]?.detail}
                        </AlertDescription>
                    </Alert>
                ) : (
                    /* Keyed by recording, so switching starts a fresh player
                       rather than carrying the last one's position and play
                       state over. The audio is fetched through our own route,
                       which attaches the session's token. */
                    <AudioPlayer
                        key={selectedRecording.id}
                        src={selectedRecording.streamUrl}
                    />
                )}


                {selectedTranscription ? (
                    <>
                        {/* As with the recording above: one transcription needs
                            naming, not choosing between. */}
                        {/* The badge sits beside whichever of these is shown,
                            so the status is next to the transcript it
                            describes rather than in a corner of the card. */}
                        <div className="flex flex-wrap items-center gap-3">
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

                            <TranscriptionOrigin
                                origin={selectedTranscription.origin}
                            />
                        </div>

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

/**
 * Whether a transcript is still as the machine wrote it.
 *
 * A badge rather than a line of prose: it is a property of the transcript, and
 * a reader wants it while reading rather than as a paragraph to get past.
 * `title` carries the longer explanation for anyone who wants it.
 */
function TranscriptionOrigin({ origin }: { origin: ContentOrigin }) {
    const badge = ORIGIN_BADGES[origin];

    /*
     * An unknown origin renders nothing rather than an empty badge. The API is
     * the only source of this value and it is an enum there, so this is
     * defence against a version skew — a badge saying "undefined" would be
     * worse than none.
     */
    if (!badge) {
        return null;
    }

    return (
        <Badge variant={badge.variant} size="sm" title={badge.title}>
            {badge.label}
        </Badge>
    );
}

/**
 * How each upload state reads, and how much it should stand out.
 *
 * `detail` is what replaces the player: the api refuses anything that is not
 * `UPLOADED`, so in those states there is nothing to play and the reason is
 * more use than a control that fails on press.
 */
const STATUS_BADGES: Record<
    FileStatus,
    {
        label: string;
        variant: "success" | "warning" | "destructive";
        detail: string;
    }
> = {
    UPLOADED: {
        label: "Ready",
        variant: "success",
        detail: "",
    },
    UPLOADING: {
        label: "Uploading",
        variant: "warning",
        detail: "This recording is still being uploaded. It will play once the upload finishes.",
    },
    INITIAL: {
        label: "Not uploaded",
        variant: "destructive",
        detail: "The file behind this recording never arrived in the store, so there is nothing to play. Uploading it again is the fix.",
    },
};

/**
 * Whether a recording is actually there.
 *
 * "Ready" is worth showing rather than leaving implicit: without it, the two
 * states that *cannot* play look like a broken player rather than an
 * unfinished upload.
 */
function RecordingStatus({ status }: { status?: FileStatus }) {
    /*
     * Nothing at all when the api did not say, rather than assuming ready —
     * that is the one wrong guess to make here, because it would present an
     * absent recording as a working one.
     */
    if (!status) {
        return null;
    }

    const badge = STATUS_BADGES[status];

    // Likewise for a state added later: an unlabelled badge helps nobody.
    if (!badge) {
        return null;
    }

    return (
        <Badge variant={badge.variant} size="sm">
            {badge.label}
        </Badge>
    );
}
