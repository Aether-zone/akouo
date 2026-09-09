"use client";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@aether-zone/kosmos";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import { addTemplate } from "./actions";

/**
 * Creates a template and opens it, so the next thing — editing it, saving a
 * version — is where you already are.
 */
export function CreateTemplateDialog({
    trigger,
}: {
    trigger: (open: () => void) => ReactNode;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [contentError, setContentError] = useState<string | null>(null);

    function reset() {
        setName("");
        setDescription("");
        setContent("");
        setError(null);
        setNameError(null);
        setContentError(null);
    }

    function handleOpenChange(next: boolean) {
        if (!next && pending) return;
        setOpen(next);
        if (!next) reset();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setNameError(null);
        setContentError(null);

        startTransition(async () => {
            const created = await addTemplate({ name, description, content });

            if (!created.ok) {
                setNameError(created.fieldErrors?.name ?? null);
                setContentError(created.fieldErrors?.content ?? null);
                if (!created.fieldErrors) {
                    setError(created.error ?? "Could not save this template.");
                }
                return;
            }

            setOpen(false);
            reset();
            router.refresh();
            router.push(`/templates/${created.templateId}`);
        });
    }

    return (
        <>
            {trigger(() => {
                reset();
                setOpen(true);
            })}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>New template</DialogTitle>
                            <DialogDescription>
                                Text you mean to reuse — the shape of a summary,
                                the wording of a prompt.
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
                                error={nameError ?? undefined}
                            >
                                {(field) => (
                                    <Input
                                        {...field}
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        placeholder="Meeting summary"
                                        disabled={pending}
                                        autoFocus
                                    />
                                )}
                            </FormField>

                            <FormField label="Description">
                                {(field) => (
                                    <Input
                                        {...field}
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                        placeholder="What it is for"
                                        disabled={pending}
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Body"
                                required
                                error={contentError ?? undefined}
                            >
                                {(field) => (
                                    <Textarea
                                        {...field}
                                        value={content}
                                        onChange={(event) =>
                                            setContent(event.target.value)
                                        }
                                        placeholder={"## Decisions\n## Actions"}
                                        className="min-h-40 font-mono text-xs"
                                        disabled={pending}
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
                                {pending ? "Saving…" : "Create template"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
