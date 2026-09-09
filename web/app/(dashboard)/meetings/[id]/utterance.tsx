"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select, Text, Textarea } from "@aether-zone/kosmos";
import { SpeakerTag, Timecode, type Speaker } from "@akouo/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { UtteranceLocation } from "@/lib/transcriptions";

import {
    linkUtteranceParticipant,
    saveUtteranceContent,
} from "./actions";

/** One turn of the transcript, as the page hands it over. */
export type TranscriptionUtterance = {
    id: string;
    /**
     * Who to show as the speaker: the participant's name once the turn has been
     * attributed to one, and the diarization label ("Speaker A") until then.
     */
    speakerLabel: string;
    /**
     * The raw diarization label, kept for the colour alone — a voice holds the
     * same one across a transcript, which a name shared by two people would not.
     */
    diarizationLabel: string;
    /** The participant this turn is attributed to, if anyone has said. */
    participantId: string | null;
    startMs: number;
    text: string;
};

export type UtteranceParticipant = { id: string; name: string };

const UNASSIGNED = "";

const SPEAKER_SLOTS = 6;

/**
 * A colour from the diarization palette per speaker: "A" takes the first, "B" the
 * second, and a seventh speaker wraps back round rather than falling off the end.
 */
function speakerSlot(label: string): Speaker {
    const position = label.trim().toUpperCase().charCodeAt(0) - 65;
    const slot = Number.isNaN(position)
        ? 0
        : ((position % SPEAKER_SLOTS) + SPEAKER_SLOTS) % SPEAKER_SLOTS;

    return (slot + 1) as Speaker;
}

/**
 * One turn: when it was said, who said it, and what they said — each of the last
 * two editable in place.
 *
 * Attributing a turn asks whether it applies to this line alone or to every line
 * from the same voice, because diarization labels a voice consistently: naming
 * one line usually means naming all of them, but a label that drifted mid-meeting
 * would otherwise take the wrong lines with it.
 */
export function Utterance({
    utterance,
    location,
    participants,
}: {
    utterance: TranscriptionUtterance;
    location: UtteranceLocation;
    participants: UtteranceParticipant[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(utterance.text);

    /** Set while the dialog asks how far a new attribution should reach. */
    const [linking, setLinking] = useState<string | null>(null);

    function saveContent() {
        setError(null);
        startTransition(async () => {
            const result = await saveUtteranceContent(
                location,
                utterance.id,
                draft
            );

            if (!result.ok) {
                setError(result.error);
                return;
            }

            setEditing(false);
            router.refresh();
        });
    }

    function handleParticipantChange(participantId: string) {
        setError(null);

        // Clearing an attribution only ever concerns this line; there is no
        // speaker to spread the absence of one across.
        if (participantId === UNASSIGNED) {
            applyLink(null, "utterance");
            return;
        }

        setLinking(participantId);
    }

    function applyLink(
        participantId: string | null,
        scope: "utterance" | "speaker"
    ) {
        setLinking(null);
        startTransition(async () => {
            const result = await linkUtteranceParticipant(
                location,
                utterance.id,
                participantId,
                scope
            );

            if (!result.ok) {
                setError(result.error);
                return;
            }

            router.refresh();
        });
    }

    const linkingName = participants.find(
        (participant) => participant.id === linking
    )?.name;

    return (
        <li className="flex gap-3">
            {/* The API counts in milliseconds, a timecode in seconds. */}
            <Timecode
                seconds={utterance.startMs / 1000}
                className="shrink-0 pt-1"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                    <SpeakerTag
                        speaker={speakerSlot(utterance.diarizationLabel)}
                        name={utterance.speakerLabel}
                        size="sm"
                    />
                    <Select
                        aria-label="Attribute this line to a participant"
                        className="h-7 w-auto max-w-[12rem] py-0 text-xs"
                        value={utterance.participantId ?? UNASSIGNED}
                        disabled={pending || participants.length === 0}
                        onChange={(event) =>
                            handleParticipantChange(event.target.value)
                        }
                    >
                        <option value={UNASSIGNED}>Unassigned</option>
                        {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                                {participant.name}
                            </option>
                        ))}
                    </Select>
                </div>

                {editing ? (
                    <div className="flex flex-col gap-2">
                        <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            aria-label="Utterance text"
                            className="min-h-16"
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                className="px-3 py-1 text-xs"
                                onClick={saveContent}
                                disabled={pending}
                            >
                                {pending ? "Saving…" : "Save"}
                            </Button>
                            <Button
                                type="button"
                                className="px-3 py-1 text-xs"
                                variant="secondary"
                                onClick={() => {
                                    setDraft(utterance.text);
                                    setEditing(false);
                                    setError(null);
                                }}
                                disabled={pending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            setDraft(utterance.text);
                            setEditing(true);
                        }}
                        className="rounded-sm text-left text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title="Edit this line"
                    >
                        {utterance.text}
                    </button>
                )}

                {error && (
                    <Text size="body-small" className="text-destructive">
                        {error}
                    </Text>
                )}
            </div>

            <Dialog
                open={linking !== null}
                onOpenChange={(next) => {
                    if (!next) setLinking(null);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Link {linkingName}</DialogTitle>
                        <DialogDescription>
                            {utterance.diarizationLabel} is how the transcriber
                            labelled this voice. Apply this to one line, or to
                            every line it spoke?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Text tone="muted" size="body-small">
                            Lines already attributed to someone else will be
                            reassigned as well.
                        </Text>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => applyLink(linking, "utterance")}
                        >
                            Only this line
                        </Button>
                        <Button
                            type="button"
                            onClick={() => applyLink(linking, "speaker")}
                        >
                            Every line from {utterance.diarizationLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </li>
    );
}
