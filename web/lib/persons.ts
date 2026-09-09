import { apiGet, apiPost, type ApiPostFailure, type ApiResult } from "./api";
import type { Meeting } from "./meetings";

/**
 * Confirmed from live responses: { id, name, createdBy, createdAt, updatedAt }.
 * `name` is the only field the API accepts on create — anything else sent
 * alongside it is dropped rather than stored.
 */
export type Person = {
    id?: string;
    name?: string;
    createdAt?: string;
};

/** The endpoint is `/persons` — there is no `/people`. */
export function getPersons(): Promise<ApiResult<Person[]>> {
    return apiGet<Person[]>("/persons");
}

export function getPerson(id: string): Promise<ApiResult<Person>> {
    return apiGet<Person>(`/persons/${encodeURIComponent(id)}`);
}

/** The meetings this person took part in, newest first. */
export function getPersonMeetings(
    id: string
): Promise<ApiResult<Meeting[]>> {
    return apiGet<Meeting[]>(`/persons/${encodeURIComponent(id)}/meetings`);
}

export function createPerson(
    name: string
): Promise<{ ok: true; data: Person } | ApiPostFailure> {
    return apiPost<Person>("/persons", { name });
}

/** Looks up display names for a meeting's participant join rows. */
export function namesByPersonId(persons: Person[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const person of persons) {
        if (person.id && person.name) {
            map.set(person.id, person.name);
        }
    }
    return map;
}
