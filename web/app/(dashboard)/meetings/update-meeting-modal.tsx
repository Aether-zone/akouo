"use client";

import type { ReactNode } from "react";

import type { Location } from "@/lib/locations";
import type { Person } from "@/lib/persons";

import { MeetingModal, type EditableMeeting } from "./meeting-modal";

/** {@link MeetingModal} opened on an existing meeting: editing it in place. */
export function UpdateMeetingModal({
    trigger,
    persons = [],
    locations = [],
    meeting,
}: {
    trigger: (open: () => void) => ReactNode;
    persons?: Person[];
    /**
     * Needed even when only editing: the autocomplete shows a *name*, and the
     * meeting carries only an id — without the list there is nothing to look
     * the name up in, and a meeting with a location would open looking as
     * though it had none.
     */
    locations?: Location[];
    meeting: EditableMeeting;
}) {
    return (
        <MeetingModal
            trigger={trigger}
            persons={persons}
            locations={locations}
            meeting={meeting}
        />
    );
}
