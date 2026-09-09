import { Test, TestingModule } from '@nestjs/testing';

import { PersonMapper } from './person.mapper';
import { PersonService } from './person.service';

/**
 * The scaffold Nest generates, given the dependencies `PersonService` actually
 * takes — it had none of them, so it had never run.
 */
describe('PersonService', () => {
  let service: PersonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        PersonMapper,
        { provide: 'PERSON_REPOSITORY', useValue: {} },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
