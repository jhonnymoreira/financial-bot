import * as z from 'zod';

export function safeJSONParse<Schema extends z.ZodType>(
  text: string,
  schema: Schema,
) {
  return z
    .string()
    .transform((value, context) => {
      try {
        return JSON.parse(value);
      } catch (err) {
        const error = err as Error;
        context.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: text,
          message: error.message,
        });
        return z.NEVER;
      }
    })
    .pipe(schema)
    .parse(text);
}
