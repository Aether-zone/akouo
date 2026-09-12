import { apiGet, type ApiResult } from "./api";

/**
 * Somewhere a meeting can be.
 *
 * akouo does not own these — a location exists because topos announced a
 * place, so there is no `createLocation` here. The way to add one is to add a
 * place in aether.
 */
export type Location = {
    id: string;
    name: string;
    /** The place IRI, or null once topos deleted the place behind it. */
    uri: string | null;
};

/**
 * Every location, or the ones matching `query`.
 *
 * The whole list is what the meeting modal asks for: locations are few, and
 * one request that the autocomplete then filters in the browser feels instant
 * where a request per keystroke does not. `query` is there for when that stops
 * being true.
 */
export function getLocations(query?: string): Promise<ApiResult<Location[]>> {
    const path = query?.trim()
        ? `/locations?q=${encodeURIComponent(query.trim())}`
        : "/locations";

    return apiGet<Location[]>(path);
}
