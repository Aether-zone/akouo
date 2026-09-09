import { createFailureResponder } from "@aether-zone/daimon";

/**
 * Turns a failure from the Nest API into one akouo's own routes can answer
 * with.
 *
 * The status map and the first three messages are the same in every route —
 * they describe the session and the organization, not what the caller was
 * doing. What a route adds is the part only it knows: what "not found" meant
 * here, and what to say when the API refused for a reason it did explain.
 *
 * A route's own wording wins over the API's, except where there is none: a
 * rejected file name, type or size is the API's own message and more use than
 * anything this layer could invent.
 */
export function failureResponder(
    options: {
        notFound?: string;
        fallbackMessage?: string;
    } = {},
) {
    return createFailureResponder<"noOrganization">({
        // Signed in but a member of nothing is a refusal, not a bad request.
        status: { noOrganization: 403 },
        messages: {
            unauthenticated: "Your session has expired. Sign in again.",
            noOrganization: "You do not belong to any organization yet.",
            forbidden: "You do not have access to this organization.",
            ...(options.notFound ? { notFound: options.notFound } : {}),
        },
        fallbackMessage: options.fallbackMessage,
    });
}
