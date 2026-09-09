import { MeetingDTO, PersonDTO, createPersonSchema } from '@akouo/contract';
import type { CreatePersonDTO } from '@akouo/contract';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import { ZodValidationPipe } from '@akouo/common';

import { PersonService } from './person.service';
import { MeetingService } from '@akouo/meeting';

@Controller('organizations/:organizationId/persons')
@UseGuards(OrganizationGuard)
export class PersonController {
  constructor(private readonly personService: PersonService, private readonly meetingService: MeetingService) { }

  @Get()
  getPersons(@CurrentActor() user: Actor): Promise<PersonDTO[]> {
    return this.personService.findAll(user);
  }

  @Get('/:id')
  getPerson(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PersonDTO> {
    return this.personService.findById(user, id);
  }

  @Post()
  createPerson(
    @CurrentActor() user: Actor,
    @Body(new ZodValidationPipe(createPersonSchema)) person: CreatePersonDTO,
  ): Promise<PersonDTO> {
    return this.personService.create(user, person);
  }

  @Delete('/:id')
  deletePerson(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.personService.delete(user, id);
  }

  @Get('/:id/meetings')
  getMeetingsForPerson(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<MeetingDTO[]> {
    return this.meetingService.findAllByPersonId(user, id);
  }
}
