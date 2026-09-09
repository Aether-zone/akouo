"use client";

import { Avatar, Button, Separator, Sidenav, SidenavContent, SidenavFooter, SidenavGroup, SidenavGroupLabel, SidenavHeader, SidenavItem } from "@aether-zone/kosmos";
import { usePathname, useRouter } from "next/navigation";
import {
    useState,
    type ComponentPropsWithoutRef,
    type MouseEvent,
    type ReactNode,
} from "react";

import { IconButton } from "@/components/icon-button";
import { initials } from "@/lib/format";

import { signOutAction } from "../actions";
import { Logo, LogoMark } from "../logo";
import {
    OrganizationSwitcher,
    type Organization,
} from "./organization-switcher";
import {
    CollapseIcon,
    ExpandIcon,
    NAV_ITEMS,
    SignOutIcon,
    isActive,
} from "./nav";

export function DashboardShell({
    userName,
    organizations,
    activeOrganizationId,
    children,
}: {
    userName: string;
    /** From the access token's `orgs` claim; resolved in the layout. */
    organizations: Organization[];
    activeOrganizationId: string | null;
    children: ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const current = NAV_ITEMS.find((item) => isActive(pathname, item.href));

    /**
     * `SidenavItem` / `NavRailItem` render real anchors, so keep the `href` for
     * middle-click and "open in new tab" and only intercept a plain left click
     * to navigate client-side.
     */
    const navigate =
        (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
            if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }
            event.preventDefault();
            router.push(href);
        };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {collapsed ? (
                <NavRail>
                    <IconButton
                        aria-label="Expand sidebar"
                        onClick={() => setCollapsed(false)}
                    >
                        <ExpandIcon />
                    </IconButton>

                    <Separator className="my-2 w-8" />

                    <OrganizationSwitcher
                        organizations={organizations}
                        activeId={activeOrganizationId}
                        collapsed
                    />

                    <Separator className="my-2 w-8" />

                    {NAV_ITEMS.map((item) => (
                        <NavRailItem
                            key={item.href}
                            aria-label={item.label}
                            href={item.href}
                            icon={item.icon}
                            active={isActive(pathname, item.href)}
                            onClick={navigate(item.href)}
                        />
                    ))}

                    <div className="mt-auto flex flex-col items-center gap-2">
                        <Avatar size="sm" fallback={initials(userName)} />
                        <form action={signOutAction}>
                            <IconButton type="submit" aria-label="Sign out">
                                <SignOutIcon />
                            </IconButton>
                        </form>
                    </div>
                </NavRail>
            ) : (
                <Sidenav>
                    {/* Kosmos's header and footer carry their own borders, so
                        the separators the old Sidebar needed are gone. */}
                    <SidenavHeader className="justify-between gap-2">
                        <Logo className="text-foreground" />
                        <IconButton
                            aria-label="Collapse sidebar"
                            onClick={() => setCollapsed(true)}
                        >
                            <CollapseIcon />
                        </IconButton>
                    </SidenavHeader>

                    <SidenavContent>
                        {/* Above the nav deliberately: it scopes everything
                            below it, so it reads as the container rather than
                            an item. */}
                        <OrganizationSwitcher
                            organizations={organizations}
                            activeId={activeOrganizationId}
                        />

                        <SidenavGroup>
                            <SidenavGroupLabel>Workspace</SidenavGroupLabel>
                            {NAV_ITEMS.map((item) => (
                                <SidenavItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    active={isActive(pathname, item.href)}
                                    onClick={navigate(item.href)}
                                >
                                    {item.label}
                                </SidenavItem>
                            ))}
                        </SidenavGroup>
                    </SidenavContent>

                    <SidenavFooter>
                        <div className="flex items-center gap-3 px-1">
                            <Avatar size="sm" fallback={initials(userName)} />
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                {userName}
                            </p>
                        </div>
                        <form action={signOutAction}>
                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full"
                            >
                                Sign out
                            </Button>
                        </form>
                    </SidenavFooter>
                </Sidenav>
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-6">
                    {collapsed && <LogoMark className="lg:hidden" />}
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        {current?.label ?? "Akouo"}
                    </h1>
                </header>

                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}


/**
 * The collapsed counterpart to Kosmos's `Sidenav`, which has no rail of its
 * own — a rail is a layout choice this app makes rather than something the
 * library takes a view on.
 *
 * Styled to match `Sidenav`'s own surface and border so the two states read as
 * the same element narrowing, not as two different chromes.
 */
function NavRail({ children }: { children: ReactNode }) {
    return (
        <nav className="flex h-full w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface p-3">
            {children}
        </nav>
    );
}

function NavRailItem({
    icon,
    active = false,
    className,
    ...props
}: ComponentPropsWithoutRef<"a"> & { icon?: ReactNode; active?: boolean }) {
    return (
        <a
            aria-current={active ? "page" : undefined}
            className={[
                "flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-accent text-accent-foreground",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...props}
        >
            <span aria-hidden="true">{icon}</span>
        </a>
    );
}

