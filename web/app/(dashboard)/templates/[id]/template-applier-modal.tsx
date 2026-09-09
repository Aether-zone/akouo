"use client";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, Autocomplete, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select, Text } from "@aether-zone/kosmos";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import {
    applyVersion,
    recordingOptions,
    transcriptionOptions,
    type Option,
} from "./apply-actions";

/**
 * Picks what to apply a template version to.
 *
 * A transcription is addressed through a meeting and a recording, so the modal
 * narrows in that order — and only asks where there is a choice: a meeting with
 * one recording, or a recording with one transcription, selects it and shows
 * nothing.
 */
export function TemplateApplierModal({
    templateId,
    versionId,
    versionNumber,
    meetings,
    trigger,
}: {
    templateId: string;
    versionId: string;
    versionNumber: number;
    /** Every meeting the caller has, for the first step. */
    meetings: Option[];
    trigger: (open: () => void) => ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    const [meetingId, setMeetingId] = useState<string | null>(null);
    /* The text in the meeting box, which Kosmos controls separately from
       the id it resolves to. */
    const [meetingQuery, setMeetingQuery] = useState("");
    const [recordings, setRecordings] = useState<Option[]>([]);
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [transcriptions, setTranscriptions] = useState<Option[]>([]);
    const [transcriptionId, setTranscriptionId] = useState<string | null>(null);

    const [loading, setLoading] = useState<"recordings" | "transcriptions" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<unknown>(undefined);

    /** The meeting's recordings, whenever the meeting changes. */
    useEffect(() => {
        if (!open || !meetingId) {
            setRecordings([]);
            setRecordingId(null);
            return;
        }

        let current = true;
        setLoading("recordings");

        recordingOptions(meetingId)
            .then((options) => {
                if (!current) return;
                setRecordings(options);
                // One recording is not a choice; take it and move on.
                setRecordingId(options.length === 1 ? options[0]!.value : null);
            })
            .catch(() => current && setError("Could not load this meeting's recordings."))
            .finally(() => current && setLoading(null));

        return () => {
            current = false;
        };
    }, [open, meetingId]);

    /** And the recording's transcriptions, the same way. */
    useEffect(() => {
        if (!open || !meetingId || !recordingId) {
            setTranscriptions([]);
            setTranscriptionId(null);
            return;
        }

        let current = true;
        setLoading("transcriptions");

        transcriptionOptions(meetingId, recordingId)
            .then((options) => {
                if (!current) return;
                setTranscriptions(options);
                setTranscriptionId(options.length === 1 ? options[0]!.value : null);
            })
            .catch(() => current && setError("Could not load this recording's transcriptions."))
            .finally(() => current && setLoading(null));

        return () => {
            current = false;
        };
    }, [open, meetingId, recordingId]);

    function reset() {
        setMeetingId(null);
        setMeetingQuery("");
        setRecordings([]);
        setRecordingId(null);
        setTranscriptions([]);
        setTranscriptionId(null);
        setError(null);
        setResult(undefined);
        setLoading(null);
    }

    function handleOpenChange(next: boolean) {
        if (!next && pending) return;
        setOpen(next);
        if (!next) reset();
    }

    function apply() {
        if (!meetingId || !recordingId || !transcriptionId) return;

        setError(null);
        setResult(undefined);

        startTransition(async () => {
            const applied = await applyVersion(templateId, versionId, {
                meetingId,
                recordingId,
                transcriptionId,
            });

            if (!applied.ok) {
                setError(applied.error);
                return;
            }

            setResult(applied.output);
        });
    }

    const ready = Boolean(meetingId && recordingId && transcriptionId);

    return (
        <>
            {trigger(() => {
                reset();
                setOpen(true);
            })}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Apply version {versionNumber}</DialogTitle>
                        <DialogDescription>
                            Choose the transcription to run it over.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <FormField label="Meeting" required>
                            {(field) => (
                                <Autocomplete
                                    {...field}
                                    options={meetings}
                                    value={meetingQuery}
                                    onValueChange={(text) => {
                                        setMeetingQuery(text);
                                        // Typing past a selection unmakes
                                        // it; `onSelect` fires after this
                                        // and puts the id back.
                                        setMeetingId(null);
                                    }}
                                    onSelect={(option) =>
                                        setMeetingId(option.value)
                                    }
                                    placeholder="Search meetings"
                                    disabled={pending}
                                    emptyMessage="No meetings"
                                />
                            )}
                        </FormField>

                        {/* Only shown when there is something to choose. */}
                        {recordings.length > 1 && (
                            <FormField label="Recording" required>
                                {(field) => (
                                    <Select
                                        {...field}
                                        value={recordingId ?? ""}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setRecordingId(
                                                event.target.value || null
                                            )
                                        }
                                    >
                                        <option value="">Choose a recording</option>
                                        {recordings.map((recording) => (
                                            <option
                                                key={recording.value}
                                                value={recording.value}
                                            >
                                                {recording.label}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </FormField>
                        )}

                        {transcriptions.length > 1 && (
                            <FormField label="Transcription" required>
                                {(field) => (
                                    <Select
                                        {...field}
                                        value={transcriptionId ?? ""}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setTranscriptionId(
                                                event.target.value || null
                                            )
                                        }
                                    >
                                        <option value="">
                                            Choose a transcription
                                        </option>
                                        {transcriptions.map((transcription) => (
                                            <option
                                                key={transcription.value}
                                                value={transcription.value}
                                            >
                                                {transcription.label}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </FormField>
                        )}

                        {loading && (
                            <Text tone="muted" size="body-small">
                                Loading {loading}…
                            </Text>
                        )}

                        {/* Nothing to run against, and nothing being fetched. */}
                        {meetingId && !loading && recordings.length === 0 && (
                            <Text tone="muted" size="body-small">
                                That meeting has no recordings.
                            </Text>
                        )}
                        {recordingId && !loading && transcriptions.length === 0 && (
                            <Text tone="muted" size="body-small">
                                That recording has not been transcribed yet.
                            </Text>
                        )}

                        {result !== undefined && (
                            <div className="flex flex-col gap-1.5">
                                <Text tone="muted" size="body-small">
                                    Result
                                </Text>
                                {/* The version's body is a JSON schema, so the
                                    answer is an object — shown as formatted
                                    JSON rather than guessed at. */}
                                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleOpenChange(false)}
                            disabled={pending}
                        >
                            {result === undefined ? "Cancel" : "Close"}
                        </Button>
                        <Button
                            type="button"
                            onClick={apply}
                            disabled={!ready || pending}
                        >
                            {pending ? "Applying…" : "Apply"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
