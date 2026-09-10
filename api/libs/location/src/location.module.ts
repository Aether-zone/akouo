import { Module } from '@nestjs/common';

import { LocationController } from './location.controller';
import { LocationListener } from './location.listener';
import { LocationMapper } from './location.mapper';
import { locationProviders } from './location.providers';
import { LocationService } from './location.service';

/**
 * Locations, projected from topos's places.
 *
 * The controller is read-only: nothing here creates or edits a location, so
 * the only thing to expose is a list. `LocationService` is exported because
 * `MeetingModule` resolves a meeting's location through it.
 */
@Module({
  providers: [
    ...locationProviders,
    LocationService,
    LocationMapper,
    LocationListener,
  ],
  controllers: [LocationController],
  exports: [LocationService],
})
export class LocationModule {}
