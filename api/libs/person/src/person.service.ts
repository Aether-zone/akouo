import { CreatePersonDTO, PersonDTO } from '@akouo/contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';

import { Person } from './person.entity';
import { PersonMapper } from './person.mapper';

@Injectable()
export class PersonService {
  constructor(
    @Inject('PERSON_REPOSITORY')
    private readonly personRepository: Repository<Person>,
    private readonly personMapper: PersonMapper,
  ) {}

  async findAll(user: Actor): Promise<PersonDTO[]> {
    const entities = await this.personRepository
      .createQueryBuilder('persons')
      .where({
        organizationId: user.organizationId,
      })
      .getMany();

    return entities.map((entity) => this.personMapper.toDTO(entity));
  }

  async findById(user: Actor, id: string): Promise<PersonDTO> {
    return this.personMapper.toDTO(await this.loadPerson(user, id));
  }

  async create(user: Actor, person: CreatePersonDTO): Promise<PersonDTO> {
    const entity: Person = this.personMapper.toEntity(person);

    entity.createdBy = user.id;

    entity.organizationId = user.organizationId;

    const saved = await this.personRepository.save(entity);

    return this.personMapper.toDTO(await this.loadPerson(user, saved.id));
  }

  /** Removing someone else's meeting is an administrative act, so it needs admin or owner. */
  async delete(user: Actor, id: string): Promise<void> {
    await this.personRepository.remove(await this.loadPerson(user, id));
  }

  private async loadPerson(user: Actor, id: string): Promise<Person> {
    const person = await this.personRepository
      .createQueryBuilder('person')
      .where({
        organizationId: user.organizationId,
        id,
      })
      .getOne();

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return person;
  }

  /**
   * Records a person announced by prosopone, or updates the one already here.
   *
   * **Idempotent by `sourceUri`.** The broker delivers at least once, so the
   * same `person.created` can arrive twice; matching on the IRI means the
   * second delivery updates the row the first created instead of filing a
   * second person with the same name. There is no other key that would do —
   * two real people share a name.
   *
   * An update rather than a skip, because the event carries the current state
   * of the resource: replaying the stream should converge on what prosopone
   * says now, not on whatever arrived first.
   *
   * Takes an `organizationId` rather than an `Actor` because there is no
   * request behind this and nobody to narrow. The tenant comes from the event,
   * which is why an event without one cannot be accepted at all: the column is
   * NOT NULL, and guessing would file a person where another tenant can read
   * them.
   */
  async upsertFromEvent(input: {
    organizationId: string;
    sourceUri: string;
    name: string;
    /** The pistis subject prosopone said caused it. Provenance only. */
    createdBy?: string | null;
  }): Promise<PersonDTO> {
    const existing = await this.personRepository.findOne({
      where: {
        organizationId: input.organizationId,
        sourceUri: input.sourceUri,
      },
    });

    const entity = existing ?? new Person();

    entity.name = input.name;
    entity.organizationId = input.organizationId;
    entity.sourceUri = input.sourceUri;

    if (!existing) {
      entity.createdBy = input.createdBy ?? null;
    }

    const saved = await this.personRepository.save(entity);

    return this.personMapper.toDTO(saved);
  }

  /**
   * Forgets that a person came from prosopone, without forgetting the person.
   *
   * prosopone deleting someone does not mean akouo should: they may sit on a
   * meeting that happened, and removing the row would either orphan those
   * participations or rewrite history to say the meeting had one fewer
   * attendee. Neither is true — the meeting had them; prosopone simply no
   * longer keeps their contact details.
   *
   * So the link is cut and the row stays. `sourceUri` going null is what says
   * "akouo's own, unreconciled": the person keeps their place in past
   * meetings, published documents fall back to `urn:akouo:person:{id}` rather
   * than claiming prosopone's namespace for someone it has dropped, and
   * `MeetingService` will not put them on anything new.
   *
   * Silent when nobody matches. A delete for a person akouo never recorded is
   * not a failure — it is an event about a resource this service never had.
   */
  async unlinkFromSource(
    organizationId: string,
    sourceUri: string,
  ): Promise<boolean> {
    const person = await this.personRepository.findOne({
      where: { organizationId, sourceUri },
    });

    if (!person) {
      return false;
    }

    person.sourceUri = null;

    await this.personRepository.save(person);

    return true;
  }

}

