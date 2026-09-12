"use client";

import type { ReactNode } from "react";

import type { Location } from "@/lib/locations";
import type { Person } from "@/lib/persons";

import { MeetingModal } from "./meeting-modal";

/** {@link MeetingModal} with no meeting behind it: scheduling a new one. */
export function CreateMeetingModal({
    trigger,
    persons = [],
    locations = [],
}: {
    trigger: (open: () => void) => ReactNode;
    persons?: Person[];
    locations?: Location[];
}) {
    return (
        <MeetingModal trigger={trigger} persons={persons} locations={locations} />
    );
}
