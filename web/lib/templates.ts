import {
    apiDelete,
    apiGet,
    apiPost,
    apiPut,
    type ApiFailure,
    type ApiPostFailure,
    type ApiResult,
} from "./api";

/**
 * A reusable piece of text — the shape of a summary, the wording of a prompt.
 * Versions are snapshots kept beside it, addressed under the template itself.
 */
export type Template = {
    id?: string;
    name?: string;
    description?: string | null;
    content?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type TemplateVersionStatus = "DRAFT" | "PUBLISHED";

export type TemplateVersion = {
    id?: string;
    templateId?: string;
    /** Counts from 1 within a template. */
    version?: number;
    content?: string;
    /** The instruction this wording goes with, when there is one. */
    prompt?: string | null;
    /** A template has at most one published version; the rest are drafts. */
    status?: TemplateVersionStatus;
    createdAt?: string;
};

export function getTemplates(): Promise<ApiResult<Template[]>> {
    return apiGet<Template[]>("/templates");
}

export function getTemplate(id: string): Promise<ApiResult<Template>> {
    return apiGet<Template>(`/templates/${encodeURIComponent(id)}`);
}

export function createTemplate(payload: {
    name: string;
    description?: string | null;
    content: string;
}): Promise<{ ok: true; data: Template } | ApiPostFailure> {
    return apiPost<Template>("/templates", payload);
}

export function updateTemplate(
    id: string,
    payload: { name?: string; description?: string | null; content?: string }
): Promise<{ ok: true; data: Template } | ApiPostFailure> {
    return apiPut<Template>(`/templates/${encodeURIComponent(id)}`, payload);
}

export function deleteTemplate(id: string): Promise<{ ok: true } | ApiFailure> {
    return apiDelete(`/templates/${encodeURIComponent(id)}`);
}

/** A template's versions, newest first. */
export function getTemplateVersions(
    id: string
): Promise<ApiResult<TemplateVersion[]>> {
    return apiGet<TemplateVersion[]>(
        `/templates/${encodeURIComponent(id)}/versions`
    );
}

export type AppliedTemplate = {
    templateVersionId?: string;
    transcriptionId?: string;
    /**
     * What the version produced, in the shape its body's JSON schema describes.
     * Unknown here: only the template's author knows the type.
     */
    output?: unknown;
};

/** Runs a version's agent over one transcription. */
export function applyTemplateVersion(
    templateId: string,
    versionId: string,
    target: { meetingId: string; recordingId: string; transcriptionId: string }
): Promise<{ ok: true; data: AppliedTemplate } | ApiPostFailure> {
    return apiPost<AppliedTemplate>(
        `/templates/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(versionId)}/apply`,
        target
    );
}

/** Makes a version the published one, and the previous one a draft again. */
export function publishTemplateVersion(
    templateId: string,
    versionId: string
): Promise<{ ok: true; data: TemplateVersion } | ApiPostFailure> {
    return apiPost<TemplateVersion>(
        `/templates/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(versionId)}/publish`,
        {}
    );
}

/**
 * Snapshots a template. With no `content` the API stores what the template says
 * right now, which is what "save a version" usually means.
 */
export function createTemplateVersion(
    id: string,
    payload: { content?: string; prompt?: string | null } = {}
): Promise<{ ok: true; data: TemplateVersion } | ApiPostFailure> {
    return apiPost<TemplateVersion>(
        `/templates/${encodeURIComponent(id)}/versions`,
        payload
    );
}
