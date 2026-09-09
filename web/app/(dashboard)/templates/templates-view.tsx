"use client";

import { Alert, AlertDescription, Button, Card, EmptyState, Text } from "@aether-zone/kosmos";
import Link from "next/link";

import { CreateTemplateDialog } from "./create-template-dialog";

export type TemplateRow = {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
};

export function TemplatesView({
    templates = [],
    unavailable = false,
}: {
    templates?: TemplateRow[];
    unavailable?: boolean;
}) {
    return (
        <div className="flex flex-col gap-6">
            {unavailable && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Could not load templates from the API.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-center justify-between gap-4">
                <Text tone="muted" size="body-small">
                    {templates.length === 1
                        ? "1 template"
                        : `${templates.length} templates`}
                </Text>
                <CreateTemplateDialog
                    trigger={(open) => (
                        <Button onClick={open}>New Template</Button>
                    )}
                />
            </div>

            {templates.length === 0 ? (
                <EmptyState
                    title="No templates yet"
                    description="A template is a piece of text you reuse — the shape of a summary, the wording of a prompt."
                    action={
                        <CreateTemplateDialog
                            trigger={(open) => (
                                <Button onClick={open}>New Template</Button>
                            )}
                        />
                    }
                />
            ) : (
                <Card className="divide-y divide-border">
                    {templates.map((template) => (
                        <Link
                            key={template.id}
                            href={`/templates/${template.id}`}
                            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {template.name}
                                </p>
                                {template.description && (
                                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                        {template.description}
                                    </p>
                                )}
                            </div>
                            <Text
                                tone="muted"
                                size="body-small"
                                className="shrink-0"
                            >
                                {template.updatedAt}
                            </Text>
                        </Link>
                    ))}
                </Card>
            )}
        </div>
    );
}
