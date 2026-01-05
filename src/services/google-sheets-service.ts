import { auth, sheets, type sheets_v4 } from '@googleapis/sheets';
import type { Expense } from '@/types/expense.js';

type GoogleSheetsConfig = {
  spreadsheetId: string;
  sheetName: string;
  serviceAccountCredentials: string;
};

export class GoogleSheetsService {
  readonly #spreadsheetId: string;
  readonly #sheetName: string;
  readonly #serviceAccountCredentials: string;
  #sheets: sheets_v4.Sheets | null = null;

  constructor(config: GoogleSheetsConfig) {
    this.#spreadsheetId = config.spreadsheetId;
    this.#sheetName = config.sheetName;
    this.#serviceAccountCredentials = config.serviceAccountCredentials;
  }

  async appendExpense(expense: Expense): Promise<boolean> {
    const sheetsClient = this.#getSheetsClient();

    const row = [
      expense.occurredAt,
      expense.amount,
      expense.message,
      expense.category,
      expense.paymentType,
      expense.paymentIdentifier,
      expense.currency,
      expense.messageId,
      expense.registeredAt,
    ];

    try {
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId: this.#spreadsheetId,
        range: `${this.#sheetName}!A:I`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [row],
        },
      });

      return true;
    } catch (error) {
      console.error('Google Sheets API error:', error);
      return false;
    }
  }

  #getSheetsClient(): sheets_v4.Sheets {
    if (this.#sheets) {
      return this.#sheets;
    }

    const serviceAccount = JSON.parse(this.#serviceAccountCredentials);

    const googleAuth = new auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.#sheets = sheets({ version: 'v4', auth: googleAuth });

    return this.#sheets;
  }
}
