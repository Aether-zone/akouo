"use client";

import { initials } from "@/lib/format";
import { Alert, AlertDescription, Avatar, Button, Card, EmptyState, Text } from "@aether-zone/kosmos";
import Link from "next/link";

import type { Person } from "@/lib/persons";

import { CreatePersonDialog } from "../create-person-dialog";

export function PeopleView({
    persons,
    unavailable,
}: {
    persons: Person[];
    unavailable: boolean;
}) {
    return (
        <div className="flex flex-col gap-6">
            {unavailable && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Could not load people from the API.
                    </AlertDescription>
                </Alert>
            )}

            <CreatePersonDialog
                trigger={(open) => (
                    <div className="flex items-center justify-between gap-4">
                        <Text tone="muted" size="body-small">
                            {persons.length === 1
                                ? "1 person"
                                : `${persons.length} people`}
                        </Text>
                        <Button onClick={open}>Add Person</Button>
                    </div>
                )}
            />

            {persons.length === 0 ? (
                <EmptyState
                    title="No people yet"
                    description="People you add to meetings will be collected here."
                />
            ) : (
                <Card className="divide-y divide-border">
                    {persons.map((person, index) => {
                        const row = (
                            <>
                                <Avatar fallback={initials(person.name)} size="sm" />
                                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                    {person.name ?? "Unnamed"}
                                </p>
                            </>
                        );

                        // Only rows with an id can link anywhere.
                        return person.id ? (
                            <Link
                                key={person.id}
                                href={`/people/${person.id}`}
                                className="flex items-center gap-3 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            >
                                {row}
                            </Link>
                        ) : (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-4"
                            >
                                {row}
                            </div>
                        );
                    })}
                </Card>
            )}
        </div>
    );
}
