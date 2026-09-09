"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Code, EmptyState } from "@aether-zone/kosmos";

/** Only what the session actually holds — no invented preferences. */
export function SettingsView({
    username,
    email,
    userId,
    organizationName,
    organizationId,
    role,
}: {
    username: string;
    email: string;
    userId: string;
    organizationName: string;
    organizationId: string;
    role: string;
}) {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                        Held by pistis, the authorization server Akouo signs in
                        through. Change these there — Akouo keeps no copy, only
                        the subject below, which it stamps on everything you
                        create.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            Username
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {username}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">
                            {email}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Subject</p>
                        <Code>{userId}</Code>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Organization</CardTitle>
                    <CardDescription>
                        Everything you do in Akouo belongs to one organization.
                        Membership is granted in pistis; switch between them in
                        the sidebar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="text-sm font-medium text-foreground">
                            {organizationName}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            Your role
                        </p>
                        <p className="text-sm font-medium capitalize text-foreground">
                            {role}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">ID</p>
                        <Code>{organizationId}</Code>
                    </div>
                </CardContent>
            </Card>

            <EmptyState
                title="No other settings yet"
                description="Workspace and transcription preferences will appear here once the API exposes them."
            />
        </div>
    );
}
