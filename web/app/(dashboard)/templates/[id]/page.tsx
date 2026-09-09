import { notFound } from "next/navigation";

import { formatMeetingDate } from "@/lib/datetime";
import { getMeetings } from "@/lib/meetings";
import { getTemplate, getTemplateVersions } from "@/lib/templates";

import { TemplateDetailView } from "./template-detail-view";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getTemplate(id);
    const name = result.ok ? result.data.name : undefined;

    return { title: name ? `${name} — Akouo` : "Template — Akouo" };
}

export default async function TemplateDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getTemplate(id);

    if (!result.ok) {
        if (result.reason === "notFound") {
            notFound();
        }
        return <TemplateDetailView unavailable />;
    }

    /*
     * Versions are their own resource. A failure there costs the history rather
     * than the template, so it is not folded into the check above.
     */
    const versionsResult = await getTemplateVersions(id);
    const versions = (versionsResult.ok ? versionsResult.data : [])
        .filter((version) => version.id)
        .map((version) => ({
            id: version.id!,
            version: version.version ?? 0,
            content: version.content ?? "",
            prompt: version.prompt ?? null,
            status: version.status ?? "DRAFT",
            createdAt: formatMeetingDate(version.createdAt),
        }));

    // The apply modal starts from a meeting; the rest it fetches as it narrows.
    const meetingsResult = await getMeetings();
    const meetings = (meetingsResult.ok ? meetingsResult.data : [])
        .filter((meeting) => meeting.id)
        .map((meeting) => ({
            value: meeting.id!,
            label: `${meeting.title ?? "Untitled meeting"} — ${formatMeetingDate(meeting.startDate)}`,
        }));

    return (
        <TemplateDetailView
            id={result.data.id ?? id}
            name={result.data.name ?? "Untitled template"}
            description={result.data.description ?? null}
            content={result.data.content ?? ""}
            updatedAt={formatMeetingDate(result.data.updatedAt)}
            versions={versions}
            meetings={meetings}
            versionsUnavailable={!versionsResult.ok}
        />
    );
}
