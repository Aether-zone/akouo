"use server";

import { revalidatePath } from "next/cache";

import { createPerson, type Person } from "@/lib/persons";

export type AddPersonResult = {
    error?: string;
    fieldErrors?: { name?: string };
    /** The saved person, so callers can use it without waiting for a refetch. */
    created?: Person;
};

export async function addPerson(rawName: string): Promise<AddPersonResult> {
    const name = rawName.trim();

    if (!name) {
        return { fieldErrors: { name: "Enter a name." } };
    }

    const result = await createPerson(name);

    if (!result.ok) {
        // Surface the API's own per-field message where there is one.
        const nameIssue = result.body?.errors?.find(
            (issue) => issue.path === "name"
        );
        if (nameIssue?.message) {
            return { fieldErrors: { name: nameIssue.message } };
        }
        return { error: result.body?.message ?? "Could not add this person." };
    }

    revalidatePath("/people");
    // The scheduling and upload dialogs pick participants from this same list.
    revalidatePath("/meetings");

    return { created: result.data };
}
