import type { ReactNode } from "react";

/**
 * Icons are inline SVG — the convention across this repo (see the website's
 * SiteHeader and the library's PasswordInput).
 *
 * They size themselves rather than leaning on a parent's `[&>svg]:size-*`
 * rule, which is what the old `Sidebar`/`NavRail` supplied. Kosmos's
 * `SidenavItem` wraps an icon in a `size-4` span but sets nothing on the svg,
 * and a bare `Button` wraps it in nothing at all — an svg with a viewBox and
 * no width would be left to the browser's replaced-element default in there.
 */
const svg = {
    className: "size-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
} as const;

function DashboardIcon() {
    return (
        <svg {...svg}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function MeetingsIcon() {
    return (
        <svg {...svg}>
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
        </svg>
    );
}

function PeopleIcon() {
    return (
        <svg {...svg}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.4a6.5 6.5 0 0 1 4 5.6" />
        </svg>
    );
}

function TemplatesIcon() {
    return (
        <svg {...svg}>
            <rect x="4" y="3" width="12" height="16" rx="2" />
            <path d="M8 8h4M8 12h4" />
            <path d="M18 7v12a2 2 0 0 1-2 2H7" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg {...svg}>
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2.2" />
            <circle cx="8" cy="17" r="2.2" />
        </svg>
    );
}

export type NavItem = {
    href: string;
    label: string;
    icon: ReactNode;
};

export const NAV_ITEMS: NavItem[] = [
    { href: "/", label: "Dashboard", icon: <DashboardIcon /> },
    { href: "/meetings", label: "Meetings", icon: <MeetingsIcon /> },
    { href: "/people", label: "People", icon: <PeopleIcon /> },
    { href: "/templates", label: "Templates", icon: <TemplatesIcon /> },
    { href: '/extractions', label: 'Extractions', icon: <TemplatesIcon /> },
    { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

/** Exact match for the index route, prefix match for the rest. */
export function isActive(pathname: string, href: string): boolean {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function CollapseIcon() {
    return (
        <svg {...svg}>
            <path d="M15 6l-6 6 6 6" />
        </svg>
    );
}

export function ExpandIcon() {
    return (
        <svg {...svg}>
            <path d="M9 6l6 6-6 6" />
        </svg>
    );
}

export function SignOutIcon() {
    return (
        <svg {...svg}>
            <path d="M15 17v1.5A2.5 2.5 0 0 1 12.5 21h-6A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3h6A2.5 2.5 0 0 1 15 5.5V7" />
            <path d="M10 12h11M18 9l3 3-3 3" />
        </svg>
    );
}
