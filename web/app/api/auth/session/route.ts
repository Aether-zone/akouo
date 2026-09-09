import { createSessionRoute } from "@aether-zone/daimon";

import { activeOrganization, organizationsOf } from "@/lib/organizations";
import { auth } from "@/lib/auth";

/**
 * Who is signed in, for client components. Returns the person and their
 * organizations, and never the access token — that stays in an httpOnly cookie
 * the browser cannot read.
 */
export const GET = createSessionRoute(auth.getSession, async (session) => ({
    user: session?.user ?? null,
    organizations: organizationsOf(session?.organizations),
    activeOrganization: (await activeOrganization())?.id ?? null,
}));
