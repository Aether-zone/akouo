"use client";

import { initials } from "@/lib/format";
import { Alert, AlertDescription, Avatar, BreadcrumbItem, Breadcrumbs, Heading, Text } from "@aether-zone/kosmos";

import type { Meeting } from "@/lib/meetings";

import { MeetingList } from "../../meeting-list";

export function PersonDetailView({
    name = "",
    meetings = [],
    meetingsUnavailable = false,
    unavailable = false,
}: {
    name?: string;
    meetings?: (Meeting & { formattedDate: string })[];
    meetingsUnavailable?: boolean;
    unavailable?: boolean;
}) {
    if (unavailable) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Could not load this person from the API.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Breadcrumbs>
                <BreadcrumbItem href="/people">People</BreadcrumbItem>
                <BreadcrumbItem current>{name}</BreadcrumbItem>
            </Breadcrumbs>

            <div className="flex items-center gap-3">
                <Avatar fallback={initials(name)} />
                <Heading level={1} size="heading">
                    {name}
                </Heading>
            </div>

            {meetingsUnavailable && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Could not load this person&apos;s meetings from the API.
                    </AlertDescription>
                </Alert>
            )}

            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <Heading level={2} size="heading-small">
                        Meetings
                    </Heading>
                    <Text tone="muted" size="body-small">
                        {meetings.length === 1
                            ? "1 meeting"
                            : `${meetings.length} meetings`}
                    </Text>
                </div>

                {/* The same rows as the meetings list, so a meeting looks the
                    same wherever it is listed. */}
                <MeetingList
                    meetings={meetings}
                    emptyTitle="No meetings yet"
                    emptyDescription={`${name} has not been added to a meeting.`}
                />
            </section>
        </div>
    );
}
