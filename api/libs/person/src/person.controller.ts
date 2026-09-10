import { MeetingDTO, PersonDTO } from '@akouo/contract';
import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';

import { PersonService } from './person.service';
import { MeetingService } from '@akouo/meeting';

/*
 * Read-only. People are not created or deleted through akouo any more: they
 * arrive from prosopone as `aether:ResourceCreated` events and are recorded by
 * `PersonListener`. The write endpoints are gone rather than deprecated,
 * because two ways in would let akouo hold a person prosopone has never heard
 * of — and nothing would reconcile them.
 */

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

  @Get('/:id/meetings')
  getMeetingsForPerson(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<MeetingDTO[]> {
    return this.meetingService.findAllByPersonId(user, id);
  }
}
