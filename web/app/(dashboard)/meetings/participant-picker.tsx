"use client";

import { Autocomplete, Badge, Label, Text } from "@aether-zone/kosmos";
import { IconButton } from "@/components/icon-button";
import { useEffect, useId, useMemo, useState } from "react";

import type { Person } from "@/lib/persons";

import { CreatePersonDialog } from "../create-person-dialog";

function XIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-3"
        >
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

/**
 * Multi-select participants.
 *
 * `Autocomplete` is single-select by design (`value: string | null`), so it is
 * used here as a search-and-pick field and the accumulated selection is shown
 * as removable chips. Picking bumps `pickerKey` to remount the field, which is
 * what clears its internal query — otherwise it would keep displaying the name
 * just chosen while that person is no longer among the options.
 *
 * People created through the `+` button are held here and merged into the
 * options, so they are usable before the server list catches up. They are
 * deduped by id once `persons` refreshes.
 */
export function ParticipantPicker({
    persons,
    selectedIds,
    onChange,
}: {
    persons: Person[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}) {
    const pickerId = useId();
    const [pickerKey, setPickerKey] = useState(0);
    const [createdPersons, setCreatedPersons] = useState<Person[]>([]);

    const named = useMemo(() => {
        const known = new Set(persons.map((person) => person.id));
        const merged = [
            ...persons,
            ...createdPersons.filter(
                (person) => person.id && !known.has(person.id)
            ),
        ];
        return merged.filter(
            (person): person is Person & { id: string; name: string } =>
                Boolean(person.id && person.name)
        );
    }, [persons, createdPersons]);

    const options = useMemo(
        () =>
            named
                .filter((person) => !selectedIds.includes(person.id))
                .map((person) => ({ label: person.name, value: person.id })),
        [named, selectedIds]
    );

    const selected = useMemo(
        () =>
            selectedIds.map((id) => ({
                id,
                name: named.find((person) => person.id === id)?.name ?? id,
            })),
        [named, selectedIds]
    );

    // Remounting drops focus; put it back so several people can be added in a
    // row without reaching for the mouse each time.
    useEffect(() => {
        if (pickerKey === 0) return;
        document.getElementById(pickerId)?.focus();
    }, [pickerKey, pickerId]);

    function add(value: string | null) {
        if (!value || selectedIds.includes(value)) return;
        onChange([...selectedIds, value]);
        setPickerKey((key) => key + 1);
    }

    function remove(id: string) {
        onChange(selectedIds.filter((selectedId) => selectedId !== id));
    }

    function handleCreated(person: Person) {
        setCreatedPersons((current) => [...current, person]);
        // A person created from here is one you meant to invite.
        if (person.id && !selectedIds.includes(person.id)) {
            onChange([...selectedIds, person.id]);
        }
    }

    const placeholder =
        named.length === 0
            ? "No people yet"
            : options.length === 0
              ? "Everyone added"
              : "Search people…";

    return (
        <div className="flex flex-col gap-3">
            <Label htmlFor={pickerId}>Participants</Label>

            <div className="flex items-center gap-2">
                <Autocomplete
                    key={pickerKey}
                    id={pickerId}
                    className="flex-1"
                    options={options}
                    onSelect={(option) => add(option.value)}
                    placeholder={placeholder}
                    emptyMessage="No matching people"
                    disabled={options.length === 0}
                />

                <CreatePersonDialog
                    onCreated={handleCreated}
                    trigger={(open) => (
                        <IconButton
                            aria-label="Add a new person"
                            variant="outline"
                            onClick={open}
                        >
                            <PlusIcon />
                        </IconButton>
                    )}
                />
            </div>

            {named.length === 0 && (
                <Text tone="muted" size="body-small">
                    No people yet — use + to add one.
                </Text>
            )}

            {selected.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {selected.map((participant) => (
                        <li key={participant.id}>
                            <Badge
                                variant="secondary"
                                className="gap-1.5 pr-1.5"
                            >
                                {participant.name}
                                <button
                                    type="button"
                                    onClick={() => remove(participant.id)}
                                    aria-label={`Remove ${participant.name}`}
                                    className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <XIcon />
                                </button>
                            </Badge>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
