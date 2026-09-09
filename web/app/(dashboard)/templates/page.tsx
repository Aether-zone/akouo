import { getTemplates } from "@/lib/templates";
import { formatMeetingDate } from "@/lib/datetime";

import { TemplatesView } from "./templates-view";

export const metadata = { title: "Templates — Akouo" };

export default async function TemplatesPage() {
    const result = await getTemplates();

    const templates = (result.ok ? result.data : [])
        .filter((template) => template.id)
        .map((template) => ({
            id: template.id!,
            name: template.name ?? "Untitled template",
            description: template.description ?? null,
            updatedAt: formatMeetingDate(template.updatedAt),
        }));

    return <TemplatesView templates={templates} unavailable={!result.ok} />;
}
