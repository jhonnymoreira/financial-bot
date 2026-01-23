import { getISODate } from '@/utils/index.js';

const DATE = '2026-01-01T03:00:00.000Z';

describe('utils: getISODate', () => {
  test('returns a formatted ISO date', () => {
    expect(getISODate(DATE)).toStrictEqual('2026-01-01');
  });

  test('accepts date', () => {
    expect(getISODate(new Date(DATE))).toStrictEqual('2026-01-01');
  });

  test('accepts a string', () => {
    expect(getISODate(DATE)).toStrictEqual('2026-01-01');
  });

  describe('options', () => {
    describe('timeZone', () => {
      test('accepts any IANA time zone value', () => {
        expect(
          getISODate(DATE, { timeZone: 'America/New_York' }),
        ).toStrictEqual('2025-12-31');
      });

      test('defaults to "America/Sao_Paulo', () => {
        const spy = vi.spyOn(Intl, 'DateTimeFormat');

        getISODate(DATE);

        const usedOptions = spy.mock.lastCall?.[1];
        expect(usedOptions).toHaveProperty('timeZone', 'America/Sao_Paulo');
      });
    });
  });
});
