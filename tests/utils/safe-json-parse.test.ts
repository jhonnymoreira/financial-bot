import * as z from 'zod';
import { safeJSONParse } from '@/utils/index.js';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

describe('utils: safeJSONParse', () => {
  test('parses valid JSON matching the schema', () => {
    const json = '{"name":"John","age":30}';

    expect(safeJSONParse(json, schema)).toStrictEqual({
      name: 'John',
      age: 30,
    });
  });

  describe('when JSON is invalid', () => {
    test('throws an error', () => {
      const invalidJson = '{invalid}';

      expect(() =>
        safeJSONParse(invalidJson, schema),
      ).toThrowErrorMatchingSnapshot();
    });
  });

  describe('when JSON does not match schema', () => {
    test('throws an error', () => {
      const json = '{"name":"John","age":"thirty"}';

      expect(() => safeJSONParse(json, schema)).toThrowErrorMatchingSnapshot();
    });
  });
});
