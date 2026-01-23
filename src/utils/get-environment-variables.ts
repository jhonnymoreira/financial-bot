import * as z from 'zod';
import { safeJSONParse } from './safe-json-parse.js';

const envSchema = z.object({
  ALLOWED_CHAT_IDS: z
    .string()
    .transform((value) => safeJSONParse(value, z.array(z.number())))
    .describe('the list of chat ids allowed to interact with the bot'),
  ALLOWED_USER_IDS: z
    .string()
    .transform((value) => safeJSONParse(value, z.array(z.number())))
    .describe('the list of user ids allowed to interact with the bot'),
  GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: z
    .string()
    .trim()
    .min(1)
    .describe(
      'the credentials used to authenticate the Google Sheets API calls',
    ),
  SPREADSHEET_ID: z
    .string()
    .trim()
    .min(1)
    .describe('the spreadsheet id to register the expenses data'),
  SPREADSHEET_BACKLOG_SHEET_NAME: z
    .string()
    .trim()
    .min(1)
    .describe(
      'the backlog sheet name within the `SPREADSHEET_ID` where the expenses data will be registered',
    ),
});

export function getEnvironmentVariables(env: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(env);
}
