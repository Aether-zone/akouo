"use server";

import { revalidatePath } from "next/cache";

import { isApiDateTime } from "@/lib/datetime";
import { createMeeting, updateMeeting } from "@/lib/meetings";

export type SaveMeetingResult =
    | { ok: true; meetingId: string }
    | { ok: false; error?: string; fieldErrors?: { title?: string } };

/** Kept for the upload dialog, which only ever creates. */
export type ScheduleMeetingResult = SaveMeetingResult;

/**
 * Creates a meeting, or saves over one when given its id.
 *
 * `participants` goes up as the whole set on an edit — the API takes off
 * whoever is missing from it — while the rows for people who stay are kept, so
 * transcript lines attributed to them are not orphaned.
 */
export async function saveMeeting(input: {
    id?: string;
    title: string;
    /** "YYYY-MM-DD HH:MM", built in the browser so the zone is the user's. */
    startDate: string;
    personIds: string[];
}): Promise<SaveMeetingResult> {
    const title = input.title.trim();

    if (!title) {
        return { ok: false, fieldErrors: { title: "Give the meeting a title." } };
    }
    if (!isApiDateTime(input.startDate)) {
        return { ok: false, error: "Could not work out the meeting's date." };
    }

    const participants = input.personIds.map((personId) => ({ personId }));

    const result = input.id
        ? await updateMeeting(input.id, {
              title,
              startDate: input.startDate,
              participants,
          })
        : await createMeeting({
              title,
              startDate: input.startDate,
              participants,
          });

    if (!result.ok) {
        const titleIssue = result.body?.errors?.find(
            (issue) => issue.path === "title"
        );
        if (titleIssue?.message) {
            return { ok: false, fieldErrors: { title: titleIssue.message } };
        }
        return {
            ok: false,
            error: result.body?.message ?? "Could not save this meeting.",
        };
    }

    const meetingId = result.data.id ?? input.id;

    if (!meetingId) {
        return { ok: false, error: "The API did not return the meeting." };
    }

    revalidatePath("/meetings");
    revalidatePath(`/meetings/${meetingId}`);
    revalidatePath("/");

    return { ok: true, meetingId };
}

/**
 * Creates a meeting and hands back its id.
 *
 * Used both on its own and ahead of an upload: recordings are only ever
 * addressed under a meeting (`/meetings/:meetingId/recordings/...`), so one
 * has to exist before a file can be sent. The file itself does not come through
 * here — it goes to the upload route handler, which can stream it.
 */
export async function scheduleMeeting(input: {
    title: string;
    /** "YYYY-MM-DD HH:MM", built in the browser so the zone is the user's. */
    startDate: string;
    personIds: string[];
}): Promise<ScheduleMeetingResult> {
    const title = input.title.trim();

    if (!title) {
        return { ok: false, fieldErrors: { title: "Give the meeting a title." } };
    }
    if (!isApiDateTime(input.startDate)) {
        return { ok: false, error: "Could not work out the meeting's date." };
    }

    const result = await createMeeting({
        title,
        startDate: input.startDate,
        participants: input.personIds.map((personId) => ({ personId })),
    });

    if (!result.ok) {
        const titleIssue = result.body?.errors?.find(
            (issue) => issue.path === "title"
        );
        if (titleIssue?.message) {
            return { ok: false, fieldErrors: { title: titleIssue.message } };
        }
        return {
            ok: false,
            error: result.body?.message ?? "Could not create the meeting.",
        };
    }

    if (!result.data.id) {
        // Without an id there is nothing to navigate to, or upload against.
        return { ok: false, error: "The API did not return the new meeting." };
    }

    revalidatePath("/meetings");
    revalidatePath("/");

    return { ok: true, meetingId: result.data.id };
}
