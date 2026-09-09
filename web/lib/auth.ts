import "server-only";

import { createAuth } from "@aether-zone/daimon";

/**
 * akouo as an OAuth client of pistis. Configured once here; everything
 * downstream takes the session and the route handlers from this object rather
 * than reading the environment again.
 *
 * There is no local account store: pistis holds the people, their passwords and
 * their organization memberships, and akouo only ever sees the tokens it signs.
 * The `organizations` scope is what puts the `orgs` claim on the token that
 * `lib/organizations.ts` reads.
 */
export const auth = createAuth({
    cookiePrefix: "akouo",
    clientId: "akouo",
    redirectUri: "http://localhost:3004/api/auth/callback",
    scopes: "profile email organizations",
});

export const getSession = auth.getSession;
