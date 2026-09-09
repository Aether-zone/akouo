"use client";

import { Button } from "@aether-zone/kosmos";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { publishVersion } from "../actions";

/**
 * Publishes one version. Only drafts get this button — a published version has
 * nowhere to go, and unpublishing means publishing something else.
 */
export function PublishVersionButton({
    templateId,
    versionId,
    onError,
}: {
    templateId: string;
    versionId: string;
    onError: (message: string | null) => void;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    function publish() {
        onError(null);
        startTransition(async () => {
            const result = await publishVersion(templateId, versionId);

            if (!result.ok) {
                onError(result.error);
                return;
            }

            router.refresh();
        });
    }

    return (
        <Button
            type="button"
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={publish}
            disabled={pending}
        >
            {pending ? "Publishing…" : "Publish"}
        </Button>
    );
}
