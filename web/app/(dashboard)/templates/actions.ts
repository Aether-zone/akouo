"use server";

import { revalidatePath } from "next/cache";

import {
    createTemplate,
    createTemplateVersion,
    publishTemplateVersion,
} from "@/lib/templates";

export type TemplateActionResult =
    | { ok: true; templateId: string }
    | { ok: false; error?: string; fieldErrors?: { name?: string; content?: string } };

export async function addTemplate(input: {
    name: string;
    description?: string;
    content: string;
}): Promise<TemplateActionResult> {
    const name = input.name.trim();
    const content = input.content.trim();

    if (!name) {
        return { ok: false, fieldErrors: { name: "Give the template a name." } };
    }
    if (!content) {
        return { ok: false, fieldErrors: { content: "A template needs a body." } };
    }

    const result = await createTemplate({
        name,
        description: input.description?.trim() || null,
        content,
    });

    if (!result.ok) {
        const issue = result.body?.errors?.find(
            (candidate) => candidate.path === "name" || candidate.path === "content"
        );

        if (issue?.path && issue.message) {
            return { ok: false, fieldErrors: { [issue.path]: issue.message } };
        }

        return {
            ok: false,
            error: result.body?.message ?? "Could not save this template.",
        };
    }

    if (!result.data.id) {
        return { ok: false, error: "The API did not return the new template." };
    }

    revalidatePath("/templates");

    return { ok: true, templateId: result.data.id };
}

export type VersionActionResult = { ok: true } | { ok: false; error: string };

/** Publishes a version. Whatever was published before becomes a draft again. */
export async function publishVersion(
    templateId: string,
    versionId: string
): Promise<VersionActionResult> {
    const result = await publishTemplateVersion(templateId, versionId);

    if (!result.ok) {
        return {
            ok: false,
            error: result.body?.message ?? "Could not publish this version.",
        };
    }

    revalidatePath(`/templates/${templateId}`);

    return { ok: true };
}

export type AddVersionResult = VersionActionResult;

/**
 * Snapshots a template. Content is optional: sending none stores what the
 * template says now, which is the usual meaning of saving a version.
 */
export async function addTemplateVersion(
    templateId: string,
    content?: string,
    prompt?: string
): Promise<AddVersionResult> {
    const trimmedContent = content?.trim();
    const trimmedPrompt = prompt?.trim();

    const result = await createTemplateVersion(templateId, {
        // Both are omitted rather than sent empty: no content means "snapshot
        // what the template says", and no prompt means the version has none.
        ...(trimmedContent ? { content: trimmedContent } : {}),
        ...(trimmedPrompt ? { prompt: trimmedPrompt } : {}),
    });

    if (!result.ok) {
        return {
            ok: false,
            error: result.body?.message ?? "Could not save this version.",
        };
    }

    revalidatePath(`/templates/${templateId}`);

    return { ok: true };
}
