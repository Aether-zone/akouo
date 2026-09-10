"use client";

import { initials } from "@/lib/format";
import { Alert, AlertDescription, Avatar, BreadcrumbItem, Breadcrumbs, Button, Card, CardContent, CardHeader, CardTitle, Heading, Text } from "@aether-zone/kosmos";
import { ScrollArea } from "@akouo/ui";
import { useState } from "react";

import type { MeetingStatus } from "@/lib/meetings";
import type { Location } from "@/lib/locations";
import type { Person } from "@/lib/persons";

import { MeetingStatusBadge } from "../../meeting-status-badge";
import { UpdateMeetingModal } from "../update-meeting-modal";
import { UploadRecordingDialog } from "../upload-recording-dialog";
import { DeleteMeetingButton } from "./delete-meeting-button";
import { RecordingCard, type MeetingRecording } from "./recording-card";
import type { UtteranceParticipant } from "./utterance";

type Participant = { key: string; personId?: string; name: string };

export function MeetingDetailView({
    id = "",
    title = "",
    startDate,
    createdAt,
    status,
    startDateValue,
    persons = [],
    locations = [],
    locationId = null,
    recordings = [],
    participants = [],
    linkableParticipants = [],
    unavailable = false,
}: {
    id?: string;
    title?: string;
    startDate?: string;
    createdAt?: string;
    status?: MeetingStatus;
    /** The raw API value, for the edit modal's date and time pickers. */
    startDateValue?: string;
    /** Everyone who could be added as a participant. */
    persons?: Person[];
    locations?: Location[];
    /** The meeting's location, so the edit modal opens on it. */
    locationId?: string | null;
    recordings?: MeetingRecording[];
    participants?: Participant[];
    /** Participants reduced to what attributing a turn needs. */
    linkableParticipants?: UtteranceParticipant[];
    unavailable?: boolean;
}) {
    const [deleteError, setDeleteError] = useState<string | null>(null);

    if (unavailable) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Could not load this meeting from the API.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Breadcrumbs>
                <BreadcrumbItem href="/meetings">Meetings</BreadcrumbItem>
                <BreadcrumbItem current>{title}</BreadcrumbItem>
            </Breadcrumbs>

            {deleteError && (
                <Alert variant="destructive">
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <Heading level={1} size="heading">
                        {title}
                    </Heading>
                    <Text tone="muted" size="body-small">
                        {startDate}
                    </Text>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <UpdateMeetingModal
                        persons={persons}
                        locations={locations}
                        meeting={{
                            id,
                            title,
                            startDate: startDateValue,
                            locationId,
                            personIds: participants
                                .map((participant) => participant.personId)
                                .filter((personId): personId is string =>
                                    Boolean(personId)
                                ),
                        }}
                        trigger={(open) => (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={open}
                            >
                                Edit Meeting
                            </Button>
                        )}
                    />
                    {/* The meeting is already there, so the dialog asks for the
                        file alone. */}
                    <UploadRecordingDialog
                        meeting={{ id, title }}
                        trigger={(open) => (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={open}
                            >
                                Upload recording
                            </Button>
                        )}
                    />
                    <DeleteMeetingButton
                        id={id}
                        title={title}
                        onError={setDeleteError}
                    />
                </div>
            </div>

            {/* Side by side from `lg` up, where the grid's default stretch is
                what gives the two cards a common height; stacked below it. */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <Text tone="muted" size="body-small">
                                Starts
                            </Text>
                            <Text size="body-small">{startDate}</Text>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Text tone="muted" size="body-small">
                                Created
                            </Text>
                            <Text size="body-small">{createdAt}</Text>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Text tone="muted" size="body-small">
                                Status
                            </Text>
                            <MeetingStatusBadge status={status} />
                        </div>
                    </CardContent>
                </Card>

                {/* The details card sets the row's height. Taking the list out
                    of flow at `lg` is what keeps it from setting its own: it
                    fills whatever the row gives it and scrolls inside that,
                    however many participants there are. Stacked below `lg`
                    there is no row to match, so it takes its own height up to a
                    cap instead. */}
                <Card className="relative flex min-h-0 flex-col">
                    <CardHeader>
                        <CardTitle>
                            Participants ({participants.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative min-h-0 flex-1 p-0">
                        {participants.length === 0 ? (
                            <Text
                                tone="muted"
                                size="body-small"
                                className="block px-6 pb-6"
                            >
                                Nobody has been added to this meeting yet.
                            </Text>
                        ) : (
                            <ScrollArea className="max-h-72 divide-y divide-border lg:absolute lg:inset-0 lg:max-h-none">
                                {participants.map((participant) => (
                                    <div
                                        key={participant.key}
                                        className="flex items-center gap-3 px-6 py-3"
                                    >
                                        <Avatar
                                            fallback={initials(participant.name)}
                                            size="sm"
                                        />
                                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                            {participant.name}
                                        </p>
                                    </div>
                                ))}
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>

            <section className="flex flex-col gap-3">
                <Heading level={2} size="heading-small">
                    Recordings
                </Heading>

                <RecordingCard
                    meetingId={id}
                    recordings={recordings}
                    participants={linkableParticipants}
                />
            </section>

        </div>
    );
}
