"use client";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@aether-zone/kosmos";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import type { Person } from "@/lib/persons";

import { addPerson } from "./people/actions";

/**
 * Modal for adding a person. `name` is the only field the API accepts, so it
 * is the only field here.
 *
 * `trigger` lets the caller supply its own opener (header button, a `+` beside
 * a field) without this component owning the button styling. `onCreated` hands
 * the saved person back so the caller can use it immediately — the scheduling
 * form selects it as a participant without waiting for a refetch.
 */
export function CreatePersonDialog({
    trigger,
    onCreated,
}: {
    trigger: (open: () => void) => ReactNode;
    onCreated?: (person: Person) => void;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function reset() {
        setName("");
        setError(null);
        setFieldError(null);
    }

    function openDialog() {
        reset();
        setOpen(true);
    }

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) reset();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setFieldError(null);

        startTransition(async () => {
            const result = await addPerson(name);

            if (result.fieldErrors?.name) {
                setFieldError(result.fieldErrors.name);
                return;
            }
            if (result.error) {
                setError(result.error);
                return;
            }

            // Saved — the action revalidated the list, so just close.
            if (result.created) {
                onCreated?.(result.created);
            }
            reset();
            setOpen(false);
        });
    }

    return (
        <>
            {trigger(openDialog)}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Add a person</DialogTitle>
                            <DialogDescription>
                                People can be added as participants on a
                                meeting.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 py-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                label="Name"
                                required
                                error={fieldError ?? undefined}
                            >
                                {(field) => (
                                    <Input
                                        {...field}
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        placeholder="Ada Lovelace"
                                        autoFocus
                                        required
                                    />
                                )}
                            </FormField>
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
                                {pending ? "Adding…" : "Add person"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
