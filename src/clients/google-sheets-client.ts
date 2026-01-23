import { auth, sheets, type sheets_v4 } from '@googleapis/sheets';

type GoogleSheetsClientConfig = {
  serviceAccountCredentials: string;
};

export class GoogleSheetsClient {
  #client: sheets_v4.Sheets | undefined;

  readonly #serviceAccountCredentials: GoogleSheetsClientConfig['serviceAccountCredentials'];

  constructor({ serviceAccountCredentials }: GoogleSheetsClientConfig) {
    this.#serviceAccountCredentials = serviceAccountCredentials;
  }

  async append({
    sheetName,
    spreadsheetId,
    values,
  }: {
    sheetName: string;
    spreadsheetId: string;
    values: Required<NonNullable<sheets_v4.Schema$ValueRange['values']>>;
  }) {
    try {
      const client = this.#getClient();

      await client.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });

      return true;
    } catch (err) {
      const error = err as Error;

      console.error('[Google Sheets Client] Error saving to the spreadsheet');
      console.error(error.message);
      console.error(error.stack);

      return false;
    }
  }

  #getClient() {
    if (!this.#client) {
      return this.#createClient();
    }

    return this.#client;
  }

  #createClient() {
    const serviceAccount = JSON.parse(this.#serviceAccountCredentials);

    const googleAuth = new auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.#client = sheets({ version: 'v4', auth: googleAuth });

    return this.#client;
  }
}
