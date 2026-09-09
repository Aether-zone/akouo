"use client";

import { AlertDialog, Button } from "@aether-zone/kosmos";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteRecording } from "./actions";

/**
 * Removes one recording from a meeting. Follows DeleteMeetingButton: the caller
 * owns where a failure is shown, since that belongs with the thing being deleted
 * rather than inside the button.
 */
export function DeleteRecordingButton({
    meetingId,
    recordingId,
    name,
    onError,
}: {
    meetingId: string;
    recordingId: string;
    name: string;
    onError: (message: string | null) => void;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function confirm() {
        onError(null);
        startTransition(async () => {
            const result = await deleteRecording(meetingId, recordingId);

            if (!result.ok) {
                onError(result.error);
                return;
            }

            // The card falls back to whatever recording is left, or the empty
            // state, once the page has the new list.
            router.refresh();
        });
    }

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                className="text-destructive"
                disabled={pending || !recordingId}
                onClick={() => setOpen(true)}
            >
                {pending ? "Deleting…" : "Delete"}
            </Button>

            <AlertDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete this recording?"
                description={`“${name}”, its transcriptions and the stored audio will be removed. This cannot be undone.`}
                confirmLabel="Delete"
                tone="destructive"
                busy={pending}
                onConfirm={confirm}
            />
        </>
    );
}
