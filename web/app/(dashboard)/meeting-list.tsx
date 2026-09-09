"use client";

import { Badge, Card, EmptyState } from "@aether-zone/kosmos";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Meeting } from "@/lib/meetings";

import { MeetingStatusBadge } from "./meeting-status-badge";

/** Rows for a list of meetings, or an empty state when there are none. */
export function MeetingList({
    meetings,
    emptyTitle,
    emptyDescription,
    emptyAction,
}: {
    meetings: (Meeting & { formattedDate: string })[];
    emptyTitle: string;
    emptyDescription: string;
    emptyAction?: ReactNode;
}) {
    if (meetings.length === 0) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                action={emptyAction}
            />
        );
    }

    return (
        <Card className="divide-y divide-border">
            {meetings.map((meeting, index) => {
                const row = (
                    <>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                                {meeting.title ?? "Untitled meeting"}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {meeting.formattedDate}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <MeetingStatusBadge status={meeting.status} />
                            <Badge variant="secondary">
                                {meeting.participants?.length ?? 0} participants
                            </Badge>
                        </div>
                    </>
                );

                // Only rows with an id can link anywhere.
                return meeting.id ? (
                    <Link
                        key={meeting.id}
                        href={`/meetings/${meeting.id}`}
                        className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                        {row}
                    </Link>
                ) : (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-4 p-4"
                    >
                        {row}
                    </div>
                );
            })}
        </Card>
    );
}
