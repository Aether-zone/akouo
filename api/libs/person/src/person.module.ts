import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonMapper } from './person.mapper';
import { personProviders } from './person.providers';
import { PersonController } from './person.controller';
import { MeetingModule } from '@akouo/meeting';

@Module({
  imports: [
    MeetingModule
  ],
  providers: [...personProviders, PersonService, PersonMapper],
  exports: [PersonService],
  controllers: [PersonController],
})
export class PersonModule { }
