import { getExtractions } from "@/lib/extractions";
import { formatMeetingDate } from "@/lib/datetime";

import { ExtractionsView } from "./extractions-view";

export const metadata = { title: "Templates — Akouo" };

export default async function ExtractionsPage() {
    const result = await getExtractions();

    const extractions = (result.ok ? result.data : [])
        .filter((extraction) => extraction.id)
        .map((extraction) => ({
            id: extraction.id!,
            name: extraction.name ?? "Untitled template",
            description: extraction.description ?? null,
            updatedAt: formatMeetingDate(extraction.updatedAt),
        }));

    return <ExtractionsView extractions={extractions} unavailable={!result.ok} />;
}
