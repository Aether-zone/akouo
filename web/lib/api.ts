import {
    createApiClient,
    classify,
    type ApiErrorBody as DaimonApiErrorBody,
    type ApiFailure as DaimonApiFailure,
    type ApiResult as DaimonApiResult,
    type TargetResolver,
} from "@aether-zone/daimon";

import { activeOrganization } from "./organizations";
import { getSession } from "./auth";

const API_URL = process.env.AKOUO_API_URL ?? "http://localhost:3310";

/**
 * `noOrganization` is signed in but a member of nothing — distinct from
 * `unauthenticated`, because signing in again would not help. Someone has to
 * add them to an organization in pistis.
 */
export type ApiFailure = DaimonApiFailure<"noOrganization">;
export type ApiResult<T> = DaimonApiResult<T, "noOrganization">;
export type ApiErrorBody = DaimonApiErrorBody;

/**
 * Every failure from the shared client already carries the parsed body, so this
 * is an alias rather than a wider type. Kept as a name because callers read as
 * "this is the failure I can map onto a form".
 */
export type ApiPostFailure = ApiFailure;

/** An upload failure keeps the upstream status, so 413/415 can be told apart. */
export type ApiUploadFailure = ApiPostFailure & { status?: number };

/**
 * Resolves a path against the organization the person is working in.
 *
 * Every route on the Nest api is mounted under `/organizations/:organizationId`,
 * so `apiGet("/meetings")` reaches `/organizations/<active>/meetings`. Doing it
 * here rather than at each call site is deliberate: the organization is not
 * something thirty callers should each remember to add, and the api answers 403
 * — not 404 — for one the token does not carry, so a forgotten prefix would
 * surface as a puzzling permission error rather than a bad URL.
 *
 * Annotated rather than left to inference, so `noOrganization` is the only
 * reason added to daimon's base four.
 */
const resolve: TargetResolver<"noOrganization"> = async (path) => {
    const session = await getSession();

    if (!session) {
        return { ok: false, reason: "unauthenticated" };
    }

    const organization = await activeOrganization();

    if (!organization) {
        // Signed in, but pistis says they belong to nowhere. Nothing in akouo
        // exists outside an organization, so there is no request to make.
        return { ok: false, reason: "noOrganization" };
    }

    return {
        ok: true,
        url: `${API_URL}/organizations/${organization.id}${path}`,
        accessToken: session.accessToken,
    };
};

const client = createApiClient(resolve);

/** GET from the Nest API, authorized with the session's access token. */
export const apiGet = client.get;

/**
 * POST to the Nest API. On failure the parsed body is passed back so callers
 * can map per-field validation messages onto their form.
 */
export const apiPost = client.post;

/**
 * PUT to the Nest API. Same failure shape as {@link apiPost}, so a caller can
 * map the API's per-field messages onto its form either way.
 */
export const apiPut = client.put;

/** DELETE against the Nest API. The response body is not used. */
export const apiDelete = client.del;

/**
 * GETs from the API and hands back the response untouched, body still unread —
 * for streaming a file through to the browser without buffering it here.
 *
 * Any status counts as reached: a route mirroring this passes 206 and 416 back
 * as faithfully as 200, which is what makes seeking work. Only a request that
 * never landed comes back as a failure.
 */
export const apiStream = (
    path: string,
    headers: Record<string, string> = {},
) => client.raw(path, { headers });

/**
 * POSTs a request body straight through to the Nest API without reading it —
 * for file uploads, so a recording is never buffered in this process. The
 * caller supplies the multipart stream and its own `Content-Type`, boundary
 * included, since re-encoding the parts here would defeat the point.
 *
 * Not built on `client.post`, which serialises JSON and would buffer the whole
 * upload to do it. The status is kept on the failure so a caller can tell 413
 * from 415, which `reason` alone folds together.
 */
export async function apiUploadStream<T>(
    path: string,
    body: ReadableStream<Uint8Array>,
    contentType: string,
    contentLength?: string | null,
): Promise<{ ok: true; data: T } | ApiUploadFailure> {
    const result = await client.raw(path, {
        method: "POST",
        headers: {
            "Content-Type": contentType,
            // Let the API (and multer's size limit) see the length up front.
            ...(contentLength ? { "Content-Length": contentLength } : {}),
        },
        body,
        // Required by undici whenever the body is a stream, and absent from the
        // DOM `RequestInit` type, hence the cast.
        duplex: "half",
    } as RequestInit & { duplex: "half" });

    if (!result.ok) {
        return { ...result, body: null };
    }

    const { response } = result;

    if (!response.ok) {
        return {
            ok: false,
            reason: classify(response.status),
            status: response.status,
            body: (await response.json().catch(() => null)) as
                | ApiErrorBody
                | null,
        };
    }

    try {
        return { ok: true, data: (await response.json()) as T };
    } catch (error) {
        console.error(`POST ${path} (upload) returned unparseable JSON:`, error);

        return { ok: false, reason: "unavailable", body: null };
    }
}
