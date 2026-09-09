import { formatMeetingDate, parseMeetingDate } from "@/lib/datetime";
import { getMeetings, type Meeting } from "@/lib/meetings";

import { DashboardView } from "./dashboard-view";

export const metadata = { title: "Dashboard — Akouo" };

/** Newest first; meetings without a usable date sort last. */
function byStartDateDesc(a: Meeting, b: Meeting): number {
    const at = parseMeetingDate(a.startDate)?.getTime() ?? NaN;
    const bt = parseMeetingDate(b.startDate)?.getTime() ?? NaN;
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
    if (Number.isNaN(at)) return 1;
    if (Number.isNaN(bt)) return -1;
    return bt - at;
}

export default async function DashboardPage() {
    const result = await getMeetings();
    const meetings = result.ok ? result.data : [];
    const now = Date.now();

    const upcomingCount = meetings.filter((meeting) => {
        const date = parseMeetingDate(meeting.startDate);
        return date !== null && date.getTime() >= now;
    }).length;

    const participantCount = meetings.reduce(
        (total, meeting) => total + (meeting.participants?.length ?? 0),
        0
    );

    const recent = [...meetings]
        .sort(byStartDateDesc)
        .slice(0, 5)
        .map((meeting) => ({
            ...meeting,
            formattedDate: formatMeetingDate(meeting.startDate),
        }));

    return (
        <DashboardView
            meetings={meetings}
            upcomingCount={upcomingCount}
            participantCount={participantCount}
            recent={recent}
            unavailable={!result.ok}
        />
    );
}
