"use client";

import { AlertDialog, Button } from "@aether-zone/kosmos";
import { useState, useTransition } from "react";

import { deleteMeeting } from "./actions";

export function DeleteMeetingButton({
    id,
    title,
    onError,
}: {
    id: string;
    title: string;
    onError: (message: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function confirm() {
        onError(null);
        startTransition(async () => {
            // On success the action redirects, so nothing comes back.
            const result = await deleteMeeting(id);
            if (result?.error) {
                onError(result.error);
            }
        });
    }

    return (
        <>
            <Button
                variant="secondary"
                className="text-destructive"
                disabled={pending || !id}
                onClick={() => setOpen(true)}
            >
                {pending ? "Deleting…" : "Delete"}
            </Button>

            <AlertDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete this meeting?"
                description={`“${title}” and its participant list will be removed. This cannot be undone.`}
                confirmLabel="Delete"
                tone="destructive"
                busy={pending}
                onConfirm={confirm}
            />
        </>
    );
}
