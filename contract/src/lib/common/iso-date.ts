import { z } from 'zod';

/** A calendar date, formatted as `yyyy-mm-dd`. */
export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date formatted as yyyy-mm-dd');

/** A date and time down to the minute, formatted as `yyyy-mm-dd HH:MM`. */
export const IsoDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
    'Expected a datetime formatted as yyyy-mm-dd HH:MM',
  );

/** Formats a moment in UTC as `yyyy-mm-dd HH:MM`, so it satisfies {@link IsoDateTime}. */
export const toIsoDateTime = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 16).replace('T', ' ');

/** Formats a moment in UTC as `yyyy-mm-dd`, so it satisfies {@link IsoDate}. */
export const toIsoDate = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 10);

/**
 * Reads an {@link IsoDateTime} back as a `Date`, interpreting it as UTC — the same
 * zone {@link toIsoDateTime} writes in, so the pair round-trips to the minute.
 */
export const fromIsoDateTime = (value: string): Date =>
  new Date(`${value.replace(' ', 'T')}:00.000Z`);
