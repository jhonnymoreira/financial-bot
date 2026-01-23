import type * as z from 'zod';

export interface ModelConstructor<
  Props,
  Instance extends Model,
  Schema extends z.ZodType,
> {
  schema: Schema;
  new (props: Props): Instance;
}

export interface Model {
  toSpreadsheetRow(): unknown[];
}
