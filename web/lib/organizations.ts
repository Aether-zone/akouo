import "server-only";

import { cookies } from "next/headers";

import type { OrganizationMembership } from "@aether-zone/daimon";

import { getSession } from "./auth";

export const ACTIVE_ORGANIZATION = "akouo.organization";

export type Organization = OrganizationMembership & { id: string };

/**
 * The organizations this person belongs to, from the token's `orgs` claim.
 *
 * pistis is the authority and akouo asks it nothing at request time. pistis
 * re-reads the memberships on every token issue, refreshes included, so a
 * change there lands here within one refresh.
 */
export function organizationsOf(
    memberships: Record<string, OrganizationMembership> | undefined
): Organization[] {
    return Object.entries(memberships ?? {})
        .map(([id, membership]) => ({ id, ...membership }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Which organization the person is currently working in.
 *
 * Everything in akouo is bound to one organization, and this is where that one
 * is chosen — not at sign-in, which is why the consent screen has no picker.
 *
 * The cookie is a preference, never a permission: it is validated against the
 * token's memberships on every read, and a stale or forged value simply falls
 * back to the first organization they really belong to. The api checks the same
 * thing again from the request path, which is where it actually matters.
 */
export async function activeOrganization(): Promise<Organization | null> {
    const session = await getSession();

    if (!session) {
        return null;
    }

    const [first, ...rest] = organizationsOf(session.organizations);

    if (!first) {
        return null;
    }

    const preferred = (await cookies()).get(ACTIVE_ORGANIZATION)?.value;

    return (
        [first, ...rest].find((org) => org.id === preferred) ?? first
    );
}
