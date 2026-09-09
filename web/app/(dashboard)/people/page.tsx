import { getPersons } from "@/lib/persons";

import { PeopleView } from "./people-view";

export const metadata = { title: "People — Akouo" };

export default async function PeoplePage() {
    const result = await getPersons();
    const persons = result.ok ? result.data : [];

    return <PeopleView persons={persons} unavailable={!result.ok} />;
}
