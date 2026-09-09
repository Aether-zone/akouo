import { searchQuerySchema } from '@akouo/contract';
import type { SearchQueryDTO, SearchResultDTO } from '@akouo/contract';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import { ZodValidationPipe } from '@akouo/common';

import { SearchService } from './search.service';

@Controller('organizations/:organizationId/search')
@UseGuards(OrganizationGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Across everything the caller has: `/search?q=budget&limit=5`. */
  @Get()
  search(
    @CurrentActor() user: Actor,
    @Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQueryDTO,
  ): Promise<SearchResultDTO[]> {
    return this.searchService.search(user, query);
  }

  /** The same search, kept to one meeting. */
  @Get('/meeting/:id')
  searchMeeting(
    @CurrentActor() user: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQueryDTO,
  ): Promise<SearchResultDTO[]> {
    return this.searchService.searchMeeting(user, id, query);
  }
}
