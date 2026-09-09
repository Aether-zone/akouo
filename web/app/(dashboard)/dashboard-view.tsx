"use client";

import { Alert, AlertDescription, Heading } from "@aether-zone/kosmos";
import { Grid, Stat } from "@akouo/ui";

import type { Meeting } from "@/lib/meetings";

import { MeetingList } from "./meeting-list";

export function DashboardView({
    meetings,
    upcomingCount,
    participantCount,
    recent,
    unavailable,
}: {
    meetings: Meeting[];
    upcomingCount: number;
    participantCount: number;
    recent: (Meeting & { formattedDate: string })[];
    unavailable: boolean;
}) {
    return (
        <div className="flex flex-col gap-6">
            {unavailable && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Could not load meetings from the API.
                    </AlertDescription>
                </Alert>
            )}

            <Grid cols={3} gap={4}>
                <Stat label="Meetings" value={meetings.length} />
                <Stat
                    label="Upcoming"
                    value={upcomingCount}
                    hint="Scheduled from now"
                />
                <Stat
                    label="Participants"
                    value={participantCount}
                    hint="Across all meetings"
                />
            </Grid>

            <section className="flex flex-col gap-3">
                <Heading level={2} size="heading-small">
                    Recent meetings
                </Heading>
                <MeetingList
                    meetings={recent}
                    emptyTitle="No meetings yet"
                    emptyDescription="Meetings you record or schedule will show up here."
                />
            </section>
        </div>
    );
}
