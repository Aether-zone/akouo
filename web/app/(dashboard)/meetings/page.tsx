import { formatMeetingDate } from "@/lib/datetime";
import { getMeetings } from "@/lib/meetings";
import { getPersons } from "@/lib/persons";

import { MeetingsView } from "./meetings-view";

export const metadata = { title: "Meetings — Akouo" };

export default async function MeetingsPage() {
    // The upload dialog picks participants from the same list.
    const [result, personsResult] = await Promise.all([
        getMeetings(),
        getPersons(),
    ]);
    const meetings = (result.ok ? result.data : []).map((meeting) => ({
        ...meeting,
        formattedDate: formatMeetingDate(meeting.startDate),
    }));

    return (
        <MeetingsView
            meetings={meetings}
            persons={personsResult.ok ? personsResult.data : []}
            unavailable={!result.ok}
        />
    );
}
