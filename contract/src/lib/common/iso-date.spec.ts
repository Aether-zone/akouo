import {
  fromIsoDateTime,
  IsoDate,
  IsoDateTime,
  toIsoDate,
  toIsoDateTime,
} from './iso-date';

describe('IsoDate', () => {
  it.each(['2026-08-09', '1999-12-31', '2000-01-01'])('accepts %s', (value) => {
    expect(IsoDate.safeParse(value).success).toBe(true);
  });

  it.each([
    ['unpadded month and day', '2026-8-9'],
    ['a datetime', '2026-08-09 12:00'],
    ['an ISO 8601 timestamp', '2026-08-09T12:00:00.000Z'],
    ['an empty string', ''],
    ['prose', 'yesterday'],
  ])('rejects %s', (_label, value) => {
    expect(IsoDate.safeParse(value).success).toBe(false);
  });
});

describe('IsoDateTime', () => {
  it.each(['2026-08-09 21:23', '2026-01-01 00:00', '2026-12-31 23:59'])(
    'accepts %s',
    (value) => {
      expect(IsoDateTime.safeParse(value).success).toBe(true);
    },
  );

  it.each([
    ['a bare date', '2026-08-09'],
    ['a T separator', '2026-08-09T21:23'],
    ['seconds', '2026-08-09 21:23:45'],
    ['an ISO 8601 timestamp', '2026-08-09T21:23:45.678Z'],
  ])('rejects %s', (_label, value) => {
    expect(IsoDateTime.safeParse(value).success).toBe(false);
  });
});

describe('formatters', () => {
  const moment = new Date('2026-08-09T21:23:45.678Z');

  it('formats a datetime to the minute in UTC', () => {
    expect(toIsoDateTime(moment)).toBe('2026-08-09 21:23');
  });

  it('formats a date in UTC', () => {
    expect(toIsoDate(moment)).toBe('2026-08-09');
  });

  it('produces values its own schema accepts', () => {
    expect(IsoDateTime.safeParse(toIsoDateTime()).success).toBe(true);
    expect(IsoDate.safeParse(toIsoDate()).success).toBe(true);
  });

  it('defaults to now when given no argument', () => {
    expect(toIsoDateTime()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(toIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('fromIsoDateTime', () => {
  it('reads a datetime as UTC', () => {
    expect(fromIsoDateTime('2026-08-09 21:23').toISOString()).toBe(
      '2026-08-09T21:23:00.000Z',
    );
  });

  it('round-trips with toIsoDateTime', () => {
    const value = '2026-12-31 23:59';

    expect(toIsoDateTime(fromIsoDateTime(value))).toBe(value);
  });
});
