import { apiGet, type ApiResult } from "./api";
import type { Recording } from "./recordings";

/**
 * Reading recordings from the API, which needs the session and so cannot live in
 * `recordings.ts` — client components import that module for the upload, and it
 * must stay free of anything server-only.
 */

/** A meeting's recordings, oldest first. Not part of the meeting's own response. */
export function getRecordings(
    meetingId: string
): Promise<ApiResult<Recording[]>> {
    return apiGet<Recording[]>(
        `/meetings/${encodeURIComponent(meetingId)}/recordings`
    );
}
