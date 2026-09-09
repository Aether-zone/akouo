/**
 * Recording uploads, in three steps.
 *
 * 1. Ask for somewhere to put the file. Our route handler relays that to the
 *    API, which asks loculus and writes a row expecting the file.
 * 2. PUT the bytes **straight to the object store**, from the browser. They
 *    cross neither this app nor the API, which is what keeps a two-hour
 *    recording from being a two-hour recording's worth of server memory.
 * 3. Claim it, by handing the API back the `fileId` from step 1. The API
 *    confirms with loculus that the object arrived before recording anything.
 *
 * The `objectKey` is never sent back in step 3 — only the `fileId`, which the
 * API issued for a meeting it had already checked. loculus has no notion of who
 * owns an object, so a key returning from a browser would be unattributable.
 *
 * Nothing server-only may be imported here: client components use this module.
 */

import {
    cancelledOr,
    putToSignedUrl,
    type UploadFailure,
} from "@aether-zone/daimon/upload";

/**
 * Mirrors the API's `UPLOAD_MAX_FILE_SIZE` default. Checked here only to fail a
 * hopeless upload before starting one; the API enforces it, and loculus signs
 * the size into the URL so the store enforces it too.
 */
export const MAX_RECORDING_BYTES = 500 * 1024 * 1024;

/** What the API answers step 1 with. */
export type PreparedUpload = {
    fileId: string;
    objectKey: string;
    uploadUrl: string;
    expiresAt: string;
};

/** What the API returns for a recording. `file` is the stored object behind it. */
export type Recording = {
    id?: string;
    meetingId?: string;
    file?: {
        id?: string;
        key?: string;
        originalName?: string;
        mimeType?: string;
        size?: number;
    };
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
};

/**
 * Where the browser plays a recording from: our own route, which attaches the
 * session's access token and passes `Range` through to the API.
 */
export function recordingStreamUrl(
    meetingId: string,
    recordingId: string
): string {
    return `/api/meetings/${encodeURIComponent(meetingId)}/recordings/${encodeURIComponent(recordingId)}/stream`;
}

export type { UploadFailure };

export type UploadRecordingResult =
    | { ok: true; recording: Recording }
    | UploadFailure;

/**
 * Uploads the file against an existing meeting.
 *
 * XHR rather than `fetch` for the PUT, because only XHR reports upload
 * progress — and a recording is big enough that a progress bar is worth the
 * older API. The two JSON calls either side use `fetch`.
 */
export async function uploadRecordingFile(
    meetingId: string,
    file: File,
    options: {
        /** Fraction uploaded, 0..1. */
        onProgress?: (fraction: number) => void;
        signal?: AbortSignal;
    } = {}
): Promise<UploadRecordingResult> {
    const { onProgress, signal } = options;

    if (signal?.aborted) {
        return { ok: false, error: "Upload cancelled.", cancelled: true };
    }

    const prepared = await prepare(meetingId, file, signal);

    if (!prepared.ok) {
        return prepared;
    }

    const sent = await putToSignedUrl(prepared.upload.uploadUrl, file, {
        onProgress,
        signal,
        messages: {
            forbidden: "The upload link has expired. Try again.",
        },
    });

    if (!sent.ok) {
        return sent;
    }

    return claim(meetingId, prepared.upload.fileId, signal);
}

/** Step 1: somewhere to put it. */
async function prepare(
    meetingId: string,
    file: File,
    signal?: AbortSignal
): Promise<{ ok: true; upload: PreparedUpload } | UploadFailure> {
    try {
        const response = await fetch(
            `/api/meetings/${encodeURIComponent(meetingId)}/recordings/presign`,
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    // Browsers leave this empty for a type they do not know; the
                    // API requires a media type, and the store will be told this
                    // one, so guess the most permissive thing rather than fail.
                    contentType: file.type || "application/octet-stream",
                    size: file.size,
                }),
                signal,
            }
        );

        const body = (await response.json().catch(() => null)) as
            | (PreparedUpload & { message?: string })
            | null;

        if (!response.ok || !body?.uploadUrl) {
            return {
                ok: false,
                error: body?.message ?? "Could not start the upload.",
            };
        }

        return { ok: true, upload: body };
    } catch (error) {
        return cancelledOr(error, "Could not reach the server to start the upload.");
    }
}

/** Step 3: tell the API the file arrived. */
async function claim(
    meetingId: string,
    fileId: string,
    signal?: AbortSignal
): Promise<UploadRecordingResult> {
    try {
        const response = await fetch(
            `/api/meetings/${encodeURIComponent(meetingId)}/recordings`,
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ fileId }),
                signal,
            }
        );

        const body = (await response.json().catch(() => null)) as
            | (Recording & { message?: string })
            | null;

        // A saved recording always has an id. Anything else behind a 2xx is not
        // the route handler answering — a sign-in page, say — and must not be
        // reported as a successful upload.
        if (response.ok && body?.id) {
            return { ok: true, recording: body };
        }

        return {
            ok: false,
            error:
                body?.message ??
                "The recording was uploaded but could not be attached to the meeting.",
        };
    } catch (error) {
        return cancelledOr(
            error,
            "The recording was uploaded but could not be attached to the meeting."
        );
    }
}

/** An aborted request is a cancellation, not a failure worth a message. */
