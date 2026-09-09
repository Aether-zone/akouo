import { apiGet, type ApiResult } from "./api";

/**
 * A reusable piece of text — the shape of a summary, the wording of a prompt.
 * Versions are snapshots kept beside it, addressed under the template itself.
 */
export type Extraction = {
    id?: string;
    name?: string;
    description?: string | null;
    content?: string;
    createdAt?: string;
    updatedAt?: string;
};

export function getExtractions(): Promise<ApiResult<Extraction[]>> {
    return apiGet<Extraction[]>("/extractions");
}

export function getTemplate(id: string): Promise<ApiResult<Extraction>> {
    return apiGet<Extraction>(`/extractions/${encodeURIComponent(id)}`);
}
