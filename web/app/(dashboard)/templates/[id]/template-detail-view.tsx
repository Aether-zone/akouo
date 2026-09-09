"use client";

import { Alert, AlertDescription, Badge, BreadcrumbItem, Breadcrumbs, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Heading, Text } from "@aether-zone/kosmos";
import { useState } from "react";

import { AddVersionDialog } from "./add-version-dialog";
import { PublishVersionButton } from "./publish-version-button";
import { TemplateApplierModal } from "./template-applier-modal";
import type { Option } from "./apply-actions";

export type TemplateVersionRow = {
    id: string;
    version: number;
    content: string;
    prompt: string | null;
    status: "DRAFT" | "PUBLISHED";
    createdAt: string;
};

export function TemplateDetailView({
    id = "",
    name = "",
    description = null,
    content = "",
    updatedAt,
    versions = [],
    meetings = [],
    versionsUnavailable = false,
    unavailable = false,
}: {
    id?: string;
    name?: string;
    description?: string | null;
    content?: string;
    updatedAt?: string;
    versions?: TemplateVersionRow[];
    /** Every meeting the caller has, for the apply modal's first step. */
    meetings?: Option[];
    versionsUnavailable?: boolean;
    unavailable?: boolean;
}) {
    const [error, setError] = useState<string | null>(null);

    if (unavailable) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Could not load this template from the API.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Breadcrumbs>
                <BreadcrumbItem href="/templates">Templates</BreadcrumbItem>
                <BreadcrumbItem current>{name}</BreadcrumbItem>
            </Breadcrumbs>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <Heading level={1} size="heading">
                        {name}
                    </Heading>
                    <Text tone="muted" size="body-small">
                        {description ?? `Last changed ${updatedAt}`}
                    </Text>
                </div>
                <AddVersionDialog
                    templateId={id}
                    currentContent={content}
                    onError={setError}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Body</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-xs text-foreground">
                        {content}
                    </pre>
                </CardContent>
            </Card>

            {versionsUnavailable && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Could not load this template&apos;s versions.
                    </AlertDescription>
                </Alert>
            )}

            <section className="flex flex-col gap-3">
                <Heading level={2} size="heading-small">
                    Versions ({versions.length})
                </Heading>

                {versions.length === 0 ? (
                    <EmptyState
                        title="No versions yet"
                        description="Save a version to keep what this template says today, before you change it."
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {versions.map((version) => (
                            <Card key={version.id}>
                                <CardContent className="flex flex-col gap-3 pt-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                Version {version.version}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    version.status ===
                                                    "PUBLISHED"
                                                        ? "success"
                                                        : "outline"
                                                }
                                            >
                                                {version.status === "PUBLISHED"
                                                    ? "Published"
                                                    : "Draft"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Text tone="muted" size="body-small">
                                                {version.createdAt}
                                            </Text>
                                            {/* Only a draft can be published;
                                                the published one is already
                                                where it is going. */}
                                            <TemplateApplierModal
                                                templateId={id}
                                                versionId={version.id}
                                                versionNumber={version.version}
                                                meetings={meetings}
                                                trigger={(open) => (
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="px-3 py-1 text-xs"
                                                        onClick={open}
                                                    >
                                                        Apply
                                                    </Button>
                                                )}
                                            />
                                            {version.status === "DRAFT" && (
                                                <PublishVersionButton
                                                    templateId={id}
                                                    versionId={version.id}
                                                    onError={setError}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {version.prompt && (
                                        <div className="flex flex-col gap-1">
                                            <Text tone="muted" size="body-small">
                                                Prompt
                                            </Text>
                                            <p className="text-sm text-foreground">
                                                {version.prompt}
                                            </p>
                                        </div>
                                    )}
                                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                                        {version.content}
                                    </pre>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
