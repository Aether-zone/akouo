"use client";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DatePicker, Input, Label, Autocomplete } from "@aether-zone/kosmos";
import { TimePicker } from "@akouo/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import {
    fromIsoDate,
    parseMeetingDate,
    toApiDateTime,
    toIsoDate,
} from "@/lib/datetime";

import type { Location } from "@/lib/locations";
import type { Person } from "@/lib/persons";

import {
    saveMeeting,
    type SaveMeetingResult,
} from "./actions";
import { ParticipantPicker } from "./participant-picker";

/** The meeting being edited, when there is one. */
export type EditableMeeting = {
    /** akouo's own id for the location, or null. Preselects the autocomplete. */
    locationId?: string | null;
    id: string;
    title: string;
    /** As the API returns it: "YYYY-MM-DD HH:MM", in UTC. */
    startDate?: string;
    /** The people on it, so the picker opens with them selected. */
    personIds: string[];
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The fields of a meeting, in a dialog: used to schedule one and to edit one.
 *
 * With a `meeting` it opens on that meeting's values and saves over them; with
 * none it starts empty and creates. The two differ in their copy and in where
 * they leave you afterwards, which is all the caller has to think about.
 */
export function MeetingModal({
    trigger,
    persons = [],
    locations = [],
    meeting,
}: {
    trigger: (open: () => void) => ReactNode;
    persons?: Person[];
    /** Sent whole by the page; the autocomplete filters them in the browser. */
    locations?: Location[];
    meeting?: EditableMeeting;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    const [title, setTitle] = useState(meeting?.title ?? "");
    const [date, setDate] = useState<Date | null>(
        parseMeetingDate(meeting?.startDate)
    );
    const [time, setTime] = useState(clockOf(meeting?.startDate) ?? "09:00");
    /*
     * The location, as the id the api wants and the text the box shows.
     *
     * Two pieces of state rather than one, because they can legitimately
     * disagree: someone typing "sier" has text and no selection yet. The id is
     * what gets saved, so a half-typed name saves nothing rather than
     * something wrong.
     */
    const [locationId, setLocationId] = useState<string | null>(
        meeting?.locationId ?? null
    );
    const [locationText, setLocationText] = useState(
        locations.find((l) => l.id === meeting?.locationId)?.name ?? ""
    );
    const [personIds, setPersonIds] = useState<string[]>(
        meeting?.personIds ?? []
    );

    const [error, setError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);
    const [dateError, setDateError] = useState<string | null>(null);

    const editing = Boolean(meeting?.id);

    /** Back to the meeting's own values, or to empty when creating. */
    function reset() {
        setTitle(meeting?.title ?? "");
        setDate(parseMeetingDate(meeting?.startDate));
        setTime(clockOf(meeting?.startDate) ?? "09:00");
        setPersonIds(meeting?.personIds ?? []);
        setLocationId(meeting?.locationId ?? null);
        setLocationText(
            locations.find((l) => l.id === meeting?.locationId)?.name ?? ""
        );
        setError(null);
        setTitleError(null);
        setDateError(null);
    }

    function handleOpenChange(next: boolean) {
        // Closing mid-request would leave the save happening with nobody the wiser.
        if (!next && pending) return;
        setOpen(next);
        if (!next) reset();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setTitleError(null);
        setDateError(null);

        if (!title.trim()) {
            setTitleError("Give the meeting a title.");
            return;
        }
        if (!date || !time) {
            setDateError("Pick a date and time.");
            return;
        }

        // Built from the local parts, so the API reads it in the user's zone.
        const startDate = toApiDateTime(date, time);

        startTransition(async () => {
            const saved = await saveMeeting({
                id: meeting?.id,
                title,
                startDate,
                personIds,
                locationId,
            }).catch(
                // A Server Action rejects if the request itself never lands.
                (): SaveMeetingResult => ({
                    ok: false,
                    error: "Could not reach the server. Try again.",
                })
            );

            if (!saved.ok) {
                if (saved.fieldErrors?.title) {
                    setTitleError(saved.fieldErrors.title);
                } else {
                    setError(saved.error ?? "Could not save this meeting.");
                }
                return;
            }

            setOpen(false);
            // The action revalidated what changed; `refresh` drops the client's
            // cached copy of it.
            router.refresh();

            // A new meeting is worth opening. An edited one is already on screen.
            if (!editing) {
                router.push(`/meetings/${saved.meetingId}`);
            }
        });
    }

    return (
        <>
            {trigger(() => {
                reset();
                setOpen(true);
            })}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editing
                                    ? "Edit meeting"
                                    : "Schedule a meeting"}
                            </DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? "Changes apply to the meeting itself; its recordings stay where they are."
                                    : "Recordings and transcripts hang off a meeting, so this is where one starts."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 py-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                label="Title"
                                required
                                error={titleError ?? undefined}
                            >
                                {(field) => (
                                    <Input
                                        {...field}
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                        placeholder="Weekly sync"
                                        disabled={pending}
                                        autoFocus
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Date"
                                required
                                error={dateError ?? undefined}
                            >
                                {(field) => (
                                    <DatePicker
                                        {...field}
                                        value={date ? toIsoDate(date) : ""}
                                        onValueChange={(value) =>
                                            setDate(fromIsoDate(value))
                                        }
                                    />
                                )}
                            </FormField>

                            {/* TimePicker takes `aria-label`, not FormField's
                                id/aria wiring, so it gets a plain label. */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Start time</Label>
                                <TimePicker
                                    value={time}
                                    onChange={setTime}
                                    aria-label="Start time"
                                />
                            </div>

                            {/* Locations come from topos, by way of the
                                location events akouo consumes — there is no
                                way to add one here, so an empty list means
                                nobody has recorded a place in aether yet. */}
                            <FormField label="Location">
                                {(field) => (
                                    <Autocomplete
                                        {...field}
                                        options={locations.map((location) => ({
                                            value: location.id,
                                            label: location.name,
                                        }))}
                                        value={locationText}
                                        onValueChange={(text) => {
                                            setLocationText(text);

                                            /*
                                             * Typing after a selection means
                                             * the selection no longer matches
                                             * what is on screen. Clearing it
                                             * is what stops a half-edited name
                                             * saving the previous location.
                                             */
                                            if (locationId) {
                                                setLocationId(null);
                                            }
                                        }}
                                        onSelect={(option) => {
                                            setLocationId(option.value);
                                            setLocationText(option.label);
                                        }}
                                        placeholder={
                                            locations.length === 0
                                                ? "No places recorded in aether yet"
                                                : "Somewhere, or nowhere"
                                        }
                                        disabled={locations.length === 0}
                                        emptyMessage="No location by that name."
                                    />
                                )}
                            </FormField>

                            <ParticipantPicker
                                persons={persons}
                                selectedIds={personIds}
                                onChange={setPersonIds}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleOpenChange(false)}
                                disabled={pending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pending}>
                                {pending
                                    ? "Saving…"
                                    : editing
                                      ? "Save changes"
                                      : "Schedule meeting"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

/**
 * The "HH:MM" of an API date-time, in the reader's zone.
 *
 * The value is UTC, and `parseMeetingDate` resolves it to the right instant, so
 * the local clock parts are what should appear in the picker — the same parts
 * `toApiDateTime` will send back.
 */
function clockOf(startDate?: string): string | null {
    const date = parseMeetingDate(startDate);

    return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : null;
}
