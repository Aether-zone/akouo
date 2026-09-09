"use client";

import { Alert, AlertDescription, Card, EmptyState, Text } from "@aether-zone/kosmos";
import Link from "next/link";


export type ExtractionRow = {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
};

export function ExtractionsView({
    extractions = [],
    unavailable = false,
}: {
    extractions?: ExtractionRow[];
    unavailable?: boolean;
}) {
    return (
        <div className="flex flex-col gap-6">
            {unavailable && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Could not load extractions from the API.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-center justify-between gap-4">
                <Text tone="muted" size="body-small">
                    {extractions.length === 1
                        ? "1 extraction"
                        : `${extractions.length} extractions`}
                </Text>
            </div>

            {extractions.length === 0 ? (
                <EmptyState
                    title="No extractions yet"
                />
            ) : (
                <Card className="divide-y divide-border">
                    {extractions.map((extraction) => (
                        <Link
                            key={extraction.id}
                            href={`/extractions/${extraction.id}`}
                            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {extraction.name}
                                </p>
                            </div>
                        </Link>
                    ))}
                </Card>
            )}
        </div>
    );
}
