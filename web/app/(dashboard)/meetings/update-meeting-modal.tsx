"use client";

import type { ReactNode } from "react";

import type { Person } from "@/lib/persons";

import { MeetingModal, type EditableMeeting } from "./meeting-modal";

/** {@link MeetingModal} opened on an existing meeting: editing it in place. */
export function UpdateMeetingModal({
    trigger,
    persons = [],
    meeting,
}: {
    trigger: (open: () => void) => ReactNode;
    persons?: Person[];
    meeting: EditableMeeting;
}) {
    return (
        <MeetingModal trigger={trigger} persons={persons} meeting={meeting} />
    );
}
