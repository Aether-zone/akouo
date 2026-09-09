"use client";

import { Alert, AlertDescription, Button, Text } from "@aether-zone/kosmos";

import type { Meeting } from "@/lib/meetings";
import type { Person } from "@/lib/persons";

import { MeetingList } from "../meeting-list";
import { CreateMeetingModal } from "./create-meeting-modal";
import { UploadRecordingDialog } from "./upload-recording-dialog";

export function MeetingsView({
    meetings,
    persons,
    unavailable,
}: {
    meetings: (Meeting & { formattedDate: string })[];
    persons: Person[];
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

            <div className="flex items-center justify-between gap-4">
                <Text tone="muted" size="body-small">
                    {meetings.length === 1
                        ? "1 meeting"
                        : `${meetings.length} meetings`}
                </Text>
                <div className="flex items-center gap-2">
                    <UploadRecordingDialog
                        persons={persons}
                        trigger={(open) => (
                            <Button variant="secondary" onClick={open}>
                                Upload recording
                            </Button>
                        )}
                    />
                    <CreateMeetingModal
                        persons={persons}
                        trigger={(open) => (
                            <Button onClick={open}>Schedule Meeting</Button>
                        )}
                    />
                </div>
            </div>

            <MeetingList
                meetings={meetings}
                emptyTitle="No meetings yet"
                emptyDescription="Meetings you record or schedule will show up here."
                emptyAction={
                    <CreateMeetingModal
                        persons={persons}
                        trigger={(open) => (
                            <Button onClick={open}>Schedule a meeting</Button>
                        )}
                    />
                }
            />
        </div>
    );
}
