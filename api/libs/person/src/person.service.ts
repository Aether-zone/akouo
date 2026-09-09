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
}
