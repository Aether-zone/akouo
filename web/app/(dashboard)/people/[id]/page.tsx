import { notFound } from "next/navigation";

import { formatMeetingDate } from "@/lib/datetime";
import { getPerson, getPersonMeetings } from "@/lib/persons";

import { PersonDetailView } from "./person-detail-view";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getPerson(id);
    const name = result.ok ? result.data.name : undefined;

    return { title: name ? `${name} — Akouo` : "Person — Akouo" };
}

export default async function PersonDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getPerson(id);

    if (!result.ok) {
        if (result.reason === "notFound") {
            notFound();
        }
        return <PersonDetailView unavailable />;
    }

    /*
     * Meetings come from `/persons/:id/meetings`. A failure there costs this page
     * its list, not the person — which is why it is not folded into the check above.
     */
    const meetingsResult = await getPersonMeetings(id);
    const meetings = (meetingsResult.ok ? meetingsResult.data : []).map(
        (meeting) => ({
            ...meeting,
            formattedDate: formatMeetingDate(meeting.startDate),
        })
    );

    return (
        <PersonDetailView
            name={result.data.name ?? "Unnamed"}
            meetings={meetings}
            meetingsUnavailable={!meetingsResult.ok}
        />
    );
}
