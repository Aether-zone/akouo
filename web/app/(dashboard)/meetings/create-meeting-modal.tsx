"use client";

import type { ReactNode } from "react";

import type { Person } from "@/lib/persons";

import { MeetingModal } from "./meeting-modal";

/** {@link MeetingModal} with no meeting behind it: scheduling a new one. */
export function CreateMeetingModal({
    trigger,
    persons = [],
}: {
    trigger: (open: () => void) => ReactNode;
    persons?: Person[];
}) {
    return <MeetingModal trigger={trigger} persons={persons} />;
}
