import type { ReactNode } from "react";

import { activeOrganization, organizationsOf } from "@/lib/organizations";
import { getSession } from "@/lib/auth";

import { DashboardShell } from "./shell";

/**
 * Shell for the signed-in area. Lives in a route group so /signed-out — which
 * must not show the nav — sits outside it.
 *
 * The organizations are read here rather than fetched by the shell: they come
 * off the access token, which only the server can see, and passing them down
 * saves a request on every navigation.
 */
export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await getSession();

    return (
        <DashboardShell
            userName={session?.user?.name ?? "Account"}
            organizations={organizationsOf(session?.organizations)}
            activeOrganizationId={(await activeOrganization())?.id ?? null}
        >
            {children}
        </DashboardShell>
    );
}
