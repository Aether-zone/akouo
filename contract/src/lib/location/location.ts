import { z } from 'zod';

import { auditedSchema } from '../common';

/**
 * Somewhere a meeting can be.
 *
 * akouo does not own these: a location exists because topos announced a place,
 * and every field is a copy. There is no `createLocationSchema` for that
 * reason — nothing here may make one.
 */
export const locationSchema = auditedSchema.extend({
  name: z.string(),
  /**
   * The IRI of the place this was projected from — `urn:aether:place:{id}`.
   *
   * Null once topos has deleted that place. The location stays, because a
   * meeting that happened somewhere should keep saying where; what goes is the
   * claim that aether still knows the place.
   */
  uri: z.string().nullable(),
});

export type LocationDTO = z.infer<typeof locationSchema>;
