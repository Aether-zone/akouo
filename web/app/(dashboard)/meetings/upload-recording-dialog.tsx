"use client";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, Autocomplete, Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, FileUpload, Input, Progress, Text } from "@aether-zone/kosmos";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { nowAsApiDateTime } from "@/lib/datetime";
import { formatBytes } from "@/lib/format";
import type { Location } from "@/lib/locations";
import type { Person } from "@/lib/persons";
import {
    MAX_RECORDING_BYTES,
    uploadRecordingFile,
} from "@/lib/recordings";

import { scheduleMeeting, type ScheduleMeetingResult } from "./actions";
import { ParticipantPicker } from "./participant-picker";

function XIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-3"
        >
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}

/** Nothing in flight, creating the meeting, or sending the file. */
type Phase = "idle" | "creating" | "uploading";

/** The meeting an upload is destined for, when it already exists. */
export type UploadTargetMeeting = { id?: string; title?: string };

/**
 * Uploads a recording, and creates the meeting it belongs to when there is not
 * one already.
 *
 * The API only addresses recordings under a meeting, so without `meeting` this
 * is two steps: the meeting is created first (a Server Action), then the file
 * is presigned by our own route handler and PUT straight to the object store.
 * If the upload fails the created meeting is kept and its id held
 * here, so retrying uploads into that meeting rather than leaving a trail of
 * empty ones behind.
 *
 * Given a meeting that already exists, the fields describing one are pointless —
 * it has a title and participants of its own — so the dialog is the file alone.
 *
 * `trigger` follows the same render-prop shape as CreatePersonDialog, so the
 * caller keeps control of the button styling and placement.
 */
export function UploadRecordingDialog({
    trigger,
    persons = [],
    locations = [],
    meeting,
}: {
    trigger: (open: () => void) => ReactNode;
    /** Only needed when the dialog has to create the meeting. */
    persons?: Person[];
    /** Likewise: an existing meeting already has a location of its own. */
    locations?: Location[];
    meeting?: UploadTargetMeeting;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [personIds, setPersonIds] = useState<string[]>([]);
    /*
     * The location, as the id the api wants and the text the box shows. Two
     * pieces of state because they legitimately disagree while someone types:
     * the id is what gets saved, so a half-typed name saves nothing rather
     * than something wrong.
     */
    const [locationId, setLocationId] = useState<string | null>(null);
    const [locationText, setLocationText] = useState("");
    const [phase, setPhase] = useState<Phase>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);
    /** Set once the meeting exists, so a retry does not create a second one. */
    const [meetingId, setMeetingId] = useState<string | null>(null);
    const uploadRef = useRef<AbortController | null>(null);

    const busy = phase !== "idle";
    /*
     * A meeting is only usable as a target if it has an id — anything less and
     * the dialog falls back to creating one, rather than uploading into nothing.
     */
    const existingMeetingId = meeting?.id ?? null;
    const targetMeetingId = existingMeetingId ?? meetingId;

    function reset() {
        setFile(null);
        setTitle("");
        setPersonIds([]);
        setLocationId(null);
        setLocationText("");
        setPhase("idle");
        setProgress(0);
        setError(null);
        setFileError(null);
        setTitleError(null);
        setMeetingId(null);
        uploadRef.current = null;
    }

    function handleOpenChange(next: boolean) {
        // Closing mid-upload would lose the request with no way back to it.
        if (!next && busy) return;
        setOpen(next);
        if (!next) reset();
    }

    function selectFile(next: File | null) {
        setFile(next);
        setFileError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setFileError(null);
        setTitleError(null);

        if (!file) {
            setFileError("Choose a recording to upload.");
            return;
        }
        if (file.size > MAX_RECORDING_BYTES) {
            setFileError(
                `That file is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_RECORDING_BYTES)}.`
            );
            return;
        }
        if (!existingMeetingId && !title.trim()) {
            setTitleError("Give the meeting a title.");
            return;
        }

        let id = targetMeetingId;

        if (!id) {
            setPhase("creating");

            const created = await scheduleMeeting({
                title,
                // The recording is of a meeting that just happened.
                startDate: nowAsApiDateTime(),
                personIds,
                locationId,
            }).catch(
                // A Server Action rejects if the request itself never lands.
                (): ScheduleMeetingResult => ({
                    ok: false,
                    error: "Could not reach the server. Try again.",
                })
            );

            if (!created.ok) {
                setPhase("idle");
                if (created.fieldErrors?.title) {
                    setTitleError(created.fieldErrors.title);
                } else {
                    setError(created.error ?? "Could not create the meeting.");
                }
                return;
            }

            id = created.meetingId;
            setMeetingId(id);
        }

        const controller = new AbortController();
        uploadRef.current = controller;
        setProgress(0);
        setPhase("uploading");

        const uploaded = await uploadRecordingFile(id, file, {
            onProgress: setProgress,
            signal: controller.signal,
        });

        uploadRef.current = null;
        setPhase("idle");

        if (!uploaded.ok) {
            setError(
                uploaded.cancelled && !existingMeetingId
                    ? "Upload cancelled. The meeting was created — try again to add the recording."
                    : uploaded.error
            );
            return;
        }

        setOpen(false);
        reset();
        // The route handler revalidated the affected pages; `refresh` drops the
        // client's cached copies of them.
        router.refresh();
        // Somewhere else's meeting is worth navigating to; the one already on
        // screen is not.
        if (!existingMeetingId) {
            router.push(`/meetings/${id}`);
        }
    }

    return (
        <>
            {trigger(() => {
                reset();
                setOpen(true);
            })}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Upload a recording</DialogTitle>
                            <DialogDescription>
                                {existingMeetingId
                                    ? `Add an audio recording to ${meeting?.title ?? "this meeting"}.`
                                    : "Create a meeting from an existing audio recording."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 py-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* FileUpload takes `id` but none of FormField's aria
                                props, so only the id is passed through. */}
                            <FormField
                                label="Recording"
                                required
                                error={fileError ?? undefined}
                            >
                                {(field) => (
                                    <FileUpload
                                        id={field.id}
                                        accept="audio/*"
                                        disabled={busy}
                                        onFilesChange={(files) =>
                                            selectFile(files[0] ?? null)
                                        }
                                        label="Drop a recording here or click to browse"
                                        description={`Audio files, up to ${formatBytes(MAX_RECORDING_BYTES)}`}
                                    />
                                )}
                            </FormField>

                            {file && (
                                <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {file.name}
                                        </p>
                                        <Text tone="muted" size="body-small">
                                            {formatBytes(file.size)}
                                        </Text>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="gap-1.5 pr-1.5"
                                    >
                                        Selected
                                        <button
                                            type="button"
                                            onClick={() => selectFile(null)}
                                            disabled={busy}
                                            aria-label={`Remove ${file.name}`}
                                            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <XIcon />
                                        </button>
                                    </Badge>
                                </div>
                            )}

                            {/* Nothing to describe when the meeting is already
                                there — and once it has been created here, these
                                fields would be editing something already saved,
                                so they give way to what was created. */}
                            {existingMeetingId ? null : meetingId ? (
                                <div className="rounded-md border border-border p-3">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {title}
                                    </p>
                                    <Text tone="muted" size="body-small">
                                        Meeting created — retry to attach the
                                        recording to it.
                                    </Text>
                                </div>
                            ) : (
                                <>
                                    <FormField
                                        label="Meeting Title"
                                        required
                                        error={titleError ?? undefined}
                                    >
                                        {(field) => (
                                            <Input
                                                {...field}
                                                value={title}
                                                onChange={(event) =>
                                                    setTitle(event.target.value)
                                                }
                                                placeholder="Weekly sync"
                                                disabled={busy}
                                            />
                                        )}
                                    </FormField>

                                    {/* Locations come from topos, by way of
                                        the place events akouo consumes — there
                                        is no way to add one here, so an empty
                                        list means nobody has recorded a place
                                        in aether yet. */}
                                    <FormField label="Location">
                                        {(field) => (
                                            <Autocomplete
                                                {...field}
                                                options={locations.map(
                                                    (location) => ({
                                                        value: location.id,
                                                        label: location.name,
                                                    })
                                                )}
                                                value={locationText}
                                                onValueChange={(text) => {
                                                    setLocationText(text);

                                                    /*
                                                     * Typing after a selection
                                                     * means the selection no
                                                     * longer matches what is
                                                     * on screen. Clearing it
                                                     * stops a half-edited name
                                                     * saving the previous
                                                     * location.
                                                     */
                                                    if (locationId) {
                                                        setLocationId(null);
                                                    }
                                                }}
                                                onSelect={(option) => {
                                                    setLocationId(option.value);
                                                    setLocationText(
                                                        option.label
                                                    );
                                                }}
                                                placeholder={
                                                    locations.length === 0
                                                        ? "No places recorded in aether yet"
                                                        : "Where it happened"
                                                }
                                                disabled={
                                                    busy ||
                                                    locations.length === 0
                                                }
                                                emptyMessage="No location by that name."
                                            />
                                        )}
                                    </FormField>

                                    <ParticipantPicker
                                        persons={persons}
                                        selectedIds={personIds}
                                        onChange={setPersonIds}
                                    />
                                </>
                            )}

                            {busy && (
                                <div className="flex flex-col gap-1.5">
                                    <Progress
                                        // The meeting call is a single short
                                        // request, so it gets no percentage.
                                        value={
                                            phase === "uploading"
                                                ? Math.round(progress * 100)
                                                : undefined
                                        }
                                        aria-label="Upload progress"
                                    />
                                    <Text tone="muted" size="body-small">
                                        {phase === "creating"
                                            ? "Creating the meeting…"
                                            : `Uploading ${file?.name ?? "recording"} — ${Math.round(progress * 100)}%`}
                                    </Text>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    phase === "uploading"
                                        ? uploadRef.current?.abort()
                                        : handleOpenChange(false)
                                }
                                disabled={phase === "creating"}
                            >
                                {phase === "uploading" ? "Cancel upload" : "Close"}
                            </Button>
                            <Button type="submit" disabled={busy}>
                                {busy
                                    ? "Uploading…"
                                    : existingMeetingId
                                      ? "Upload recording"
                                      : meetingId
                                        ? "Retry upload"
                                        : "Create meeting"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
