import { CreatePersonDTO, PersonDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import { Person } from './person.entity';

@Injectable()
export class PersonMapper {
  toDTO(entity: Person): PersonDTO {
    return {
      id: entity.id,
      name: entity.name,
      organizationId: entity.organizationId,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toEntity(dto: CreatePersonDTO): Person {
    const entity: Person = new Person();

    entity.name = dto.name;

    return entity;
  }

  mapEntity(dto: PersonDTO, entity: Person) {
    entity.name = dto.name;
  }
}
