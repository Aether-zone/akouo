import { NextResponse, type NextRequest } from "next/server";

import { ACTIVE_ORGANIZATION } from "@/lib/organizations";
import { getSession } from "@/lib/auth";

/**
 * Switches the active organization.
 *
 * Refuses one the token does not carry — not because the cookie is a permission
 * (the api re-checks the path against the token on every request) but because
 * silently accepting a value that will 403 on the next page load is a worse
 * experience than saying no here.
 */
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ message: "Not signed in." }, { status: 401 });
    }

    const { organizationId } = (await request.json().catch(() => ({}))) as {
        organizationId?: unknown;
    };

    if (
        typeof organizationId !== "string" ||
        !(organizationId in session.organizations)
    ) {
        return NextResponse.json(
            { message: "You are not a member of that organization." },
            { status: 403 }
        );
    }

    const response = NextResponse.json({ active: organizationId });

    response.cookies.set(ACTIVE_ORGANIZATION, organizationId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });

    return response;
}
