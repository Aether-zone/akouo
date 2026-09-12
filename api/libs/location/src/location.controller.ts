import { LocationDTO } from '@akouo/contract';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';

import { LocationService } from './location.service';

/**
 * The locations akouo knows about.
 *
 * **Read-only, and that is the design.** A location exists because topos
 * announced a place; a POST here would make a row nothing upstream knows
 * about, which nothing could ever reconcile. The way to add one is to add a
 * place in aether.
 */
@Controller('organizations/:organizationId/locations')
@UseGuards(OrganizationGuard)
export class LocationController {
  constructor(private readonly locations: LocationService) {}

  /**
   * Every location, or the ones matching `q`.
   *
   * The filter is here rather than only in the browser so the endpoint is
   * useful to anything that is not a fully-loaded list — and so a workspace
   * with hundreds of locations does not send all of them to fill one
   * autocomplete. The console still filters what it has locally, which is what
   * makes typing feel instant; this is what makes the first load small.
   */
  @Get()
  findAll(
    @CurrentActor() actor: Actor,
    @Query('q') query?: string,
  ): Promise<LocationDTO[]> {
    return this.locations.findAll(actor.organizationId, query);
  }
}
