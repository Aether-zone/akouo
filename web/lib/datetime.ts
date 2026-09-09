/**
 * Wire-format helpers for the API's date-times.
 *
 * They live here rather than in `meetings.ts` so client components can use
 * them: that module talks to the API, and would drag the server-only session
 * into the browser bundle.
 */

/** The format the API accepts and returns for `startDate` / `endDate`. */
export const API_DATETIME = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

export function isApiDateTime(value: string): boolean {
    return API_DATETIME.test(value);
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Builds the "YYYY-MM-DD HH:MM" the API expects, from a date's *local* parts
 * and an "HH:MM" clock — never `toISOString()`, which would shift the day
 * across the UTC boundary. The API reads this as local time and stores UTC.
 */
export function toApiDateTime(date: Date, time: string): string {
    return `${toIsoDate(date)} ${time}`;
}

/**
 * A local calendar date as ISO `yyyy-mm-dd`, which is what Kosmos's
 * `DatePicker` speaks — it takes a string where the component this app used
 * before took a `Date`.
 */
export function toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The reverse, at local midnight.
 *
 * Deliberately not `new Date(value)`: a bare `yyyy-mm-dd` is parsed as UTC,
 * so west of Greenwich it lands on the previous day — and every other reader
 * of this value treats it as a local date.
 */
export function fromIsoDate(value: string): Date | null {
    const [year, month, day] = value.split("-").map(Number);

    return year && month && day ? new Date(year, month - 1, day) : null;
}

/**
 * Now, in the API's wire format. Call it from the browser: the API reads the
 * value as the *sender's* local time, and only the browser knows what that is.
 */
export function nowAsApiDateTime(): string {
    const now = new Date();
    return toApiDateTime(now, `${pad(now.getHours())}:${pad(now.getMinutes())}`);
}

/*
 * Reading and rendering the API's datetimes. These are pure and live here
 * rather than beside the meeting fetchers in `meetings.ts`, because a client
 * component needs them: `meetings.ts` imports `api.ts`, which is `server-only`,
 * so importing one helper from there pulled the whole api client — and the
 * session with it — into the browser bundle.
 */

export function parseMeetingDate(value?: string): Date | null {
    if (!value) return null;

    const match = API_DATETIME.exec(value.trim());
    if (match) {
        const [, year, month, day, hour, minute] = match;
        return new Date(
            Date.UTC(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute)
            )
        );
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Formats an API date, falling back to the raw value if unparseable. */
export function formatMeetingDate(value?: string): string {
    if (!value) return "No date";
    const date = parseMeetingDate(value);
    if (!date) return value;
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

/** Long form for the detail page. */
export function formatMeetingDateLong(value?: string): string {
    if (!value) return "No date";
    const date = parseMeetingDate(value);
    if (!date) return value;
    return date.toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
    });
}
