import { formatMeetingDate } from "@/lib/datetime";
import { getMeetings } from "@/lib/meetings";
import { getLocations } from "@/lib/locations";
import { getPersons } from "@/lib/persons";

import { MeetingsView } from "./meetings-view";

export const metadata = { title: "Meetings — Akouo" };

export default async function MeetingsPage() {
    // The upload dialog picks participants from the same list.
    const [result, personsResult, locationsResult] = await Promise.all([
        getMeetings(),
        getPersons(),
        // Few enough to send whole: the modal's autocomplete then filters in
        // the browser, which feels instant where a request per keystroke does
        // not.
        getLocations(),
    ]);
    const meetings = (result.ok ? result.data : []).map((meeting) => ({
        ...meeting,
        formattedDate: formatMeetingDate(meeting.startDate),
    }));

    return (
        <MeetingsView
            meetings={meetings}
            persons={personsResult.ok ? personsResult.data : []}
            locations={locationsResult.ok ? locationsResult.data : []}
            unavailable={!result.ok}
        />
    );
}
