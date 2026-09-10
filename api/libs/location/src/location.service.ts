import { LocationDTO } from '@akouo/contract';
import { Inject, Injectable } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';

import { Location } from './location.entity';
import { LocationMapper } from './location.mapper';

/**
 * The locations akouo knows about, all of them projected from topos.
 *
 * There is no `create` here, and that is the point: a location exists because
 * aether announced a place. A method that made one locally would produce a row
 * nothing upstream knows about, which nothing could ever reconcile.
 */
@Injectable()
export class LocationService {
  constructor(
    @Inject('LOCATION_REPOSITORY')
    private readonly locationRepository: Repository<Location>,
    private readonly locationMapper: LocationMapper,
  ) {}

  /**
   * Every location in an organization, by name — or the ones whose name
   * contains `query`.
   *
   * `ILike` rather than an exact match: someone typing "sier" is looking for
   * "Het Sieraad", and a prefix match would not find it either.
   */
  async findAll(organizationId: string, query?: string): Promise<LocationDTO[]> {
    const trimmed = query?.trim();

    const entities = await this.locationRepository.find({
      where: {
        organizationId,
        ...(trimmed ? { name: ILike(`%${trimmed}%`) } : {}),
      },
      order: { name: 'ASC' },
    });

    return entities.map((entity) => this.locationMapper.toDTO(entity));
  }

  /** One location in this organization, or null. */
  findById(organizationId: string, id: string): Promise<Location | null> {
    return this.locationRepository.findOne({ where: { organizationId, id } });
  }

  /**
   * Records a place announced by topos, or updates the one already here.
   *
   * **Idempotent by `uri`.** The broker delivers at least once, so the same
   * `place.created` can arrive twice; matching on the IRI means the second
   * delivery updates the row the first created instead of filing a second
   * location with the same name.
   *
   * An update rather than a skip, because the event carries the current state
   * of the resource: replaying the stream should converge on what topos says
   * now, not on whatever arrived first.
   */
  async upsertFromEvent(input: {
    organizationId: string;
    uri: string;
    name: string;
    /** The pistis subject topos said caused it. Provenance only. */
    createdBy?: string | null;
  }): Promise<Location> {
    const existing = await this.locationRepository.findOne({
      where: { organizationId: input.organizationId, uri: input.uri },
    });

    const entity = existing ?? new Location();

    entity.name = input.name;
    entity.organizationId = input.organizationId;
    entity.uri = input.uri;

    if (!existing) {
      entity.createdBy = input.createdBy ?? null;
    }

    return this.locationRepository.save(entity);
  }

  /**
   * Forgets that a location came from topos, without forgetting the location.
   *
   * topos deleting a place does not mean akouo should drop the row: a meeting
   * may have happened there, and removing it would either break that reference
   * or rewrite history to say the meeting was nowhere. Neither is true — the
   * meeting was there; aether simply no longer keeps the place.
   *
   * So the link is cut and the row stays, exactly as
   * `PersonService.unlinkFromSource` does. An earlier version of this deleted
   * the row, which was right only while nothing referenced a location.
   *
   * Silent when nobody matches: a delete for a place akouo never recorded is
   * an event about a resource this service never had, not a failure.
   */
  async unlinkFromSource(
    organizationId: string,
    uri: string,
  ): Promise<boolean> {
    const location = await this.locationRepository.findOne({
      where: { organizationId, uri },
    });

    if (!location) {
      return false;
    }

    location.uri = null;

    await this.locationRepository.save(location);

    return true;
  }
}
