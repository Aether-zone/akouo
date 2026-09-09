/**
 * Akouo logo — mirrors `apps/website/src/components/Logo.tsx`.
 *
 * Deliberately free of `@akouo/ui` imports: that package ships no "use client"
 * directives, so pulling its barrel into a Server Component would evaluate the
 * modules that call `createContext` at module scope.
 */

const join = (...parts: (string | false | undefined)[]) =>
    parts.filter(Boolean).join(" ");

/** The three diarization dots on their own, for large brand treatments. */
export function LogoMark({ className }: { className?: string }) {
    return (
        <span
            className={join("flex items-center gap-1.5", className)}
            aria-hidden="true"
        >
            <span className="size-3 rounded-full bg-speaker-1" />
            <span className="size-3 rounded-full bg-speaker-3" />
            <span className="size-3 rounded-full bg-speaker-5" />
        </span>
    );
}

/** Dots + wordmark. Inherits its text color from the surrounding surface. */
export function Logo({ className }: { className?: string }) {
    return (
        <span
            className={join(
                "inline-flex items-center gap-2 text-base font-semibold tracking-tight",
                className
            )}
        >
            <span className="flex items-center gap-0.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-speaker-1" />
                <span className="size-2 rounded-full bg-speaker-3" />
                <span className="size-2 rounded-full bg-speaker-5" />
            </span>
            akouo
        </span>
    );
}
