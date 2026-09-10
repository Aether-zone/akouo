import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { JsonLdDocument } from '@aether-zone/organon';

import { Location } from '@akouo/location/location.entity';
import { Person } from '@akouo/person/person.entity';

import { Meeting } from './meeting.entity';
import { Participant } from './participant/participant.entity';

/**
 * Meetings as aether's chronos describes them.
 *
 * Separate from `MeetingService` on purpose. That one serves requests: it
 * takes an `Actor`, refuses people who are no longer in prosopone, and
 * announces what it changed. None of that applies here — there is no request,
 * nobody to refuse on behalf of, and re-announcing a meeting aether just
 * announced would put the two services in a loop.
 *
 * What this does instead is *project*: take the document at face value and
 * make akouo's copy match it.
 */
@Injectable()
export class MeetingProjectionService {
  constructor(
    @Inject('MEETING_REPOSITORY')
    private readonly meetings: Repository<Meeting>,
    @Inject('MEETING_PERSON_REPOSITORY')
    private readonly people: Repository<Person>,
    @Inject('MEETING_LOCATION_REPOSITORY')
    private readonly locations: Repository<Location>,
  ) {}

  /**
   * Records a calendar entry, or updates the one already here.
   *
   * **Idempotent by `sourceUri`.** The broker delivers at least once, so the
   * same `event.created` can arrive twice; matching on the IRI means the
   * second delivery updates the row the first made.
   *
   * The people and the place are resolved through the IRIs the document
   * carries — `urn:aether:person:…` and `urn:aether:place:…` — which are
   * exactly what akouo already stores in `Person.sourceUri` and
   * `Location.uri`. That is the whole reason those columns exist, and it is
   * what lets three services agree on who was where without any of them
   * knowing the others' row ids.
   *
   * Anyone the document names whom akouo has never heard of is skipped rather
   * than invented: prosopone announces people on the same exchange, so the
   * gap closes itself when that event arrives, and guessing a Person row here
   * would create a duplicate for the real one to collide with.
   */
  async upsertFromEvent(
    organizationId: string,
    sourceUri: string,
    document: JsonLdDocument,
    createdBy: string | null,
  ): Promise<Meeting> {
    const existing = await this.meetings.findOne({
      where: { organizationId, sourceUri },
      relations: { participants: { person: true } },
    });

    const meeting = existing ?? new Meeting();

    meeting.organizationId = organizationId;
    meeting.sourceUri = sourceUri;
    meeting.title = asText(document.title) || 'Untitled';
    meeting.startDate = new Date(asText(document.startTime));
    meeting.endDate = document.endTime
      ? new Date(asText(document.endTime))
      : (null as unknown as Date);
    meeting.location = await this.locationFor(organizationId, document);

    if (!existing) {
      meeting.createdBy = createdBy;
    }

    meeting.participants = await this.participantsFor(
      organizationId,
      document,
      existing?.participants ?? [],
      meeting,
    );

    return this.meetings.save(meeting);
  }

  /**
   * Forgets that a meeting came from aether, without forgetting the meeting.
   *
   * A projected meeting may have recordings and a transcript hanging off it by
   * now, all of them akouo's own. Deleting the row on an upstream delete would
   * take those with it — so the link goes and the meeting stays, exactly as it
   * does for a person and a location.
   */
  async unlinkFromSource(
    organizationId: string,
    sourceUri: string,
  ): Promise<boolean> {
    const meeting = await this.meetings.findOne({
      where: { organizationId, sourceUri },
    });

    if (!meeting) {
      return false;
    }

    meeting.sourceUri = null;

    await this.meetings.save(meeting);

    return true;
  }

  /** The location the document points at, if akouo has it. */
  private async locationFor(
    organizationId: string,
    document: JsonLdDocument,
  ): Promise<Location | null> {
    const uri = referenceOf(document.location);

    if (!uri) {
      return null;
    }

    return this.locations.findOne({ where: { organizationId, uri } });
  }

  /**
   * The participant rows for the people the document names.
   *
   * Rows already there are reused rather than rebuilt: an utterance points at
   * a participant, so recreating the row for somebody who never left would
   * drop every line of transcript attributed to them.
   */
  private async participantsFor(
    organizationId: string,
    document: JsonLdDocument,
    existing: Participant[],
    meeting: Meeting,
  ): Promise<Participant[]> {
    const uris = referencesOf(document.attendee);

    if (uris.length === 0) {
      return [];
    }

    const people = await this.people.find({
      where: uris.map((sourceUri) => ({ organizationId, sourceUri })),
    });

    const byPersonId = new Map(
      existing
        .filter((participant) => participant.person)
        .map((participant) => [participant.person.id, participant]),
    );

    return people.map((person) => {
      const kept = byPersonId.get(person.id);

      if (kept) {
        return kept;
      }

      const participant = new Participant();

      participant.person = person;
      participant.meeting = meeting;

      return participant;
    });
  }
}

/** The IRI of a `{ '@id': … }` reference. */
function referenceOf(value: unknown): string | null {
  if (value && typeof value === 'object' && '@id' in value) {
    const id = (value as { '@id': unknown })['@id'];

    return typeof id === 'string' ? id : null;
  }

  return null;
}

/** The IRIs of a list of references, which JSON-LD may also send as one. */
function referencesOf(value: unknown): string[] {
  const items = Array.isArray(value) ? value : [value];

  return items
    .map((item) => referenceOf(item))
    .filter((uri): uri is string => uri !== null);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
