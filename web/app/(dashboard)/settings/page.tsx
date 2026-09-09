import { activeOrganization } from "@/lib/organizations";
import { getSession } from "@/lib/auth";

import { SettingsView } from "./settings-view";

export const metadata = { title: "Settings — Akouo" };

export default async function SettingsPage() {
    const session = await getSession();
    const organization = await activeOrganization();

    return (
        <SettingsView
            username={session?.user?.name ?? "—"}
            email={session?.user?.email ?? "—"}
            userId={session?.user?.id ?? "—"}
            organizationName={organization?.name ?? "—"}
            organizationId={organization?.id ?? "—"}
            role={organization?.role ?? "—"}
        />
    );
}
