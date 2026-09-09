import { NextResponse, type NextRequest } from "next/server";

import { apiStream } from "@/lib/api";
import { failureResponder } from "@/lib/failure";

const failure = failureResponder({
    fallbackMessage: "Could not reach the recording.",
});

/**
 * Streams a recording's audio to the browser.
 *
 * An `<audio>` element cannot send the session's access token, so it points here
 * and this route attaches it. The bytes are piped straight through rather than
 * buffered, and `Range` goes up while `206` / `Content-Range` come back down —
 * without that round trip the player could not seek.
 */
const FORWARDED_HEADERS = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "content-disposition",
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; recordingId: string }> }
) {
    const { id, recordingId } = await params;
    const range = request.headers.get("range");

    const result = await apiStream(
        `/meetings/${encodeURIComponent(id)}/recordings/${encodeURIComponent(recordingId)}/stream`,
        range ? { Range: range } : {}
    );

    if (!result.ok) {
        /*
         * 403 and "no organization" are not stale sessions: signing in again
         * would change nothing, so they must not be reported as 401 or the
         * browser would bounce through pistis on a loop. The shared responder
         * maps them to 403 for that reason.
         *
         * `notFound` never arrives here — `apiStream` hands back whatever the
         * api answered without classifying it, so a 404 upstream reaches the
         * player as a 404 rather than as a failure.
         */
        return failure.response(result);
    }

    const upstream = result.response;
    const headers = new Headers();

    for (const header of FORWARDED_HEADERS) {
        const value = upstream.headers.get(header);
        if (value) {
            headers.set(header, value);
        }
    }

    // A recording is nobody else's business, and it is already behind a session.
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
    });
}
