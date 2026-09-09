import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { apiPost } from "@/lib/api";
import { failureResponder } from "@/lib/failure";
import type { Recording } from "@/lib/recordings";

const failure = failureResponder({
    // The API answers 404 both for a meeting that is gone and for an upload
    // whose object never arrived, which is the same thing to someone who has
    // just watched their upload fail.
    notFound: "That upload could not be found. Try uploading again.",
    fallbackMessage: "Could not attach this recording. Try again.",
});

/**
 * Attaches an uploaded file to the meeting — the step after the browser has
 * spent its presigned URL.
 *
 * Only a `fileId` crosses this route: the object key never leaves the API, so
 * there is nothing here a caller could point at an object that was not theirs.
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

    const result = await apiPost<Recording>(
        `/meetings/${encodeURIComponent(id)}/recordings`,
        body
    );

    if (!result.ok) {
        return NextResponse.json(
            { message: failure.messageFor(result) },
            { status: failure.statusFor(result.reason) }
        );
    }

    // The meeting page lists its recordings; the list and dashboard counts
    // change too.
    revalidatePath(`/meetings/${id}`);
    revalidatePath("/meetings");
    revalidatePath("/");

    return NextResponse.json(result.data, { status: 201 });
}
