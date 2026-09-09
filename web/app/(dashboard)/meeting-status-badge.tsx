import { Badge } from "@aether-zone/kosmos";

import type { MeetingStatus } from "@/lib/meetings";

/**
 * How far a meeting has got, in words rather than the API's shouted constants:
 * scheduled and nothing more, audio stored against it, or that audio transcribed.
 */
const STATUSES: Record<
    MeetingStatus,
    { label: string; variant: "outline" | "secondary" | "success" }
> = {
    INITIAL: { label: "Scheduled", variant: "outline" },
    RECORDED: { label: "Recorded", variant: "secondary" },
    TRANSCRIBED: { label: "Transcribed", variant: "success" },
};

export function MeetingStatusBadge({ status }: { status?: MeetingStatus }) {
    // An older meeting, or one from a response that predates the field, is as
    // good as untouched.
    const { label, variant } = STATUSES[status ?? "INITIAL"] ?? STATUSES.INITIAL;

    return <Badge variant={variant}>{label}</Badge>;
}
