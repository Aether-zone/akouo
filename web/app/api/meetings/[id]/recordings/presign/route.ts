import { NextResponse, type NextRequest } from "next/server";

import { apiPost } from "@/lib/api";
import { failureResponder } from "@/lib/failure";
import type { PreparedUpload } from "@/lib/recordings";

const failure = failureResponder({
    notFound: "That meeting no longer exists.",
    fallbackMessage: "Could not start the upload. Try again.",
});

/**
 * Asks the API where this recording may be uploaded.
 *
 * A route handler rather than a Server Action because the browser has to make
 * two more calls around this one — the PUT to the store, then the claim — and
 * they have to be driven from the page. The access token stays here: it is in an
 * httpOnly cookie the browser cannot read, which is the point.
 *
 * What comes back carries a `uploadUrl` the browser spends directly against the
 * store, so no recording bytes pass through this process or the API.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const body: unknown = await request.json().catch(() => null);

    if (typeof body !== "object" || body === null) {
        return NextResponse.json(
            { message: "Expected a JSON object." },
            { status: 400 }
        );
    }

    const result = await apiPost<PreparedUpload>(
        `/meetings/${encodeURIComponent(id)}/recordings/presign`,
        body
    );

    if (!result.ok) {
        return NextResponse.json(
            { message: failure.messageFor(result) },
            { status: failure.statusFor(result.reason) }
        );
    }

    return NextResponse.json(result.data, { status: 201 });
}
