import {
    apiGet,
    apiPost,
    apiPut,
    type ApiPostFailure,
    type ApiResult,
} from "./api";

/**
 * Shapes confirmed against live API responses, not assumed.
 *
 * A meeting: { id, title, startDate, participants[], createdAt, updatedAt,
 * createdBy }. `participants` are join rows carrying only
 * `personId` — display names come from /persons. Recordings are not part of this
 * response: they are read through /meetings/:id/recordings.
 */
export type MeetingParticipant = {
    id?: string;
    personId?: string;
    meetingId?: string;
};

/** How far a meeting has got, as the API reports it. */
export type MeetingStatus = "INITIAL" | "RECORDED" | "TRANSCRIBED";

export type Meeting = {
    id?: string;
    title?: string;
    startDate?: string;
    status?: MeetingStatus;
    participants?: MeetingParticipant[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
};

export function getMeetings(): Promise<ApiResult<Meeting[]>> {
    return apiGet<Meeting[]>("/meetings");
}

export function getMeeting(id: string): Promise<ApiResult<Meeting>> {
    return apiGet<Meeting>(`/meetings/${encodeURIComponent(id)}`);
}

export function createMeeting(payload: {
    title: string;
    startDate: string;
    participants: { personId: string }[];
}): Promise<{ ok: true; data: Meeting } | ApiPostFailure> {
    return apiPost<Meeting>("/meetings", payload);
}

/**
 * Parses an API date.
 *
 * `startDate` comes back as "YYYY-MM-DD HH:MM" with no timezone, and its value
 * is UTC — the API converts the submitted local time on the way in (verified:
 * sending 10:00 stores 09:00 in winter and 08:00 in summer, i.e. DST-aware).
 * `new Date("2026-07-01 08:00")` would read that as *local* and render the
 * meeting one to two hours early, so that exact format is parsed as UTC.
 *
 * Anything else — `createdAt`/`updatedAt` are ISO-8601 with a `Z` — carries its
 * own zone and goes through the normal Date parser untouched.
 */
/**
 * Edits a meeting. Only the fields sent change — and `participants`, when sent,
 * is the whole set: whoever is missing from it is taken off the meeting.
 */
export function updateMeeting(
    id: string,
    payload: {
        title?: string;
        startDate?: string;
        participants?: { personId: string }[];
    }
): Promise<{ ok: true; data: Meeting } | ApiPostFailure> {
    return apiPut<Meeting>(`/meetings/${encodeURIComponent(id)}`, payload);
}
