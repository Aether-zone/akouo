"use client";

import { FormField } from "@/components/form-field";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Text, Textarea } from "@aether-zone/kosmos";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { addTemplateVersion } from "../actions";

/**
 * Saves a version of a template.
 *
 * It opens on the template's current body, which is the common case — a
 * snapshot of what it says today. Editing the text before saving keeps a
 * wording that was never on the template, which is what the API's optional
 * `content` is for.
 */
export function AddVersionDialog({
    templateId,
    currentContent,
    onError,
}: {
    templateId: string;
    currentContent: string;
    onError: (message: string | null) => void;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [content, setContent] = useState(currentContent);
    const [prompt, setPrompt] = useState("");

    function handleOpenChange(next: boolean) {
        if (!next && pending) return;
        setOpen(next);
        if (!next) {
            setContent(currentContent);
            setPrompt("");
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onError(null);

        startTransition(async () => {
            // Unchanged text is sent as "snapshot what is there", so the API
            // decides what current means rather than this form.
            const result = await addTemplateVersion(
                templateId,
                content === currentContent ? undefined : content,
                prompt
            );

            if (!result.ok) {
                onError(result.error);
                return;
            }

            setOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <Button
                type="button"
                onClick={() => {
                    setContent(currentContent);
                    setPrompt("");
                    setOpen(true);
                }}
            >
                Save version
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Save a version</DialogTitle>
                            <DialogDescription>
                                Keeps a copy of this wording. The template itself
                                is left as it is.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-3 py-4">
                            <FormField label="Body">
                                {(field) => (
                                    <Textarea
                                        {...field}
                                        value={content}
                                        onChange={(event) =>
                                            setContent(event.target.value)
                                        }
                                        className="min-h-48 font-mono text-xs"
                                        disabled={pending}
                                    />
                                )}
                            </FormField>
                            <Text tone="muted" size="body-small">
                                Leave it as it is to snapshot the template, or
                                change it to keep an alternative.
                            </Text>

                            <FormField
                                label="Prompt"
                                description="The instruction this wording is used with. Optional."
                            >
                                {(field) => (
                                    <Textarea
                                        {...field}
                                        value={prompt}
                                        onChange={(event) =>
                                            setPrompt(event.target.value)
                                        }
                                        placeholder="Summarise the meeting using the sections below."
                                        className="min-h-24 text-sm"
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
                                {pending ? "Saving…" : "Save version"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
