import { GoogleSheetsClient } from '@/clients/google-sheets-client.js';

const { mockAppend, mockSheets } = vi.hoisted(() => {
  const mockAppend = vi.fn();
  const mockSheets = vi.fn(() => ({
    spreadsheets: {
      values: {
        append: mockAppend,
      },
    },
  }));
  return { mockAppend, mockSheets };
});

vi.mock('@googleapis/sheets', () => ({
  auth: {
    GoogleAuth: vi.fn(),
  },
  sheets: mockSheets,
}));

const serviceAccountCredentials = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
});

describe('GoogleSheetsClient', () => {
  describe('append({ sheetName, spreadsheetId, values })', () => {
    test('calls spreadsheets.values.append with correct parameters', async () => {
      mockAppend.mockResolvedValue({});
      const client = new GoogleSheetsClient({ serviceAccountCredentials });

      await client.append({
        sheetName: 'Sheet1',
        spreadsheetId: 'spreadsheet-123',
        values: [['value1', 'value2']],
      });

      expect(mockAppend).toHaveBeenCalledWith({
        spreadsheetId: 'spreadsheet-123',
        range: 'Sheet1',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [['value1', 'value2']],
        },
      });
    });

    test('returns true on success', async () => {
      mockAppend.mockResolvedValue({});
      const client = new GoogleSheetsClient({ serviceAccountCredentials });

      const result = await client.append({
        sheetName: 'Sheet1',
        spreadsheetId: 'spreadsheet-123',
        values: [['value1']],
      });

      expect(result).toBeTruthy();
    });

    describe('when the API call fails', () => {
      test('returns false', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mockAppend.mockRejectedValue(new Error('API error'));
        const client = new GoogleSheetsClient({ serviceAccountCredentials });

        const result = await client.append({
          sheetName: 'Sheet1',
          spreadsheetId: 'spreadsheet-123',
          values: [['value1']],
        });

        expect(result).toBeFalsy();
      });
    });

    describe('when called multiple times', () => {
      test('reuses the same client instance', async () => {
        mockAppend.mockResolvedValue({});
        const client = new GoogleSheetsClient({ serviceAccountCredentials });

        await client.append({
          sheetName: 'Sheet1',
          spreadsheetId: 'spreadsheet-123',
          values: [['value1']],
        });

        await client.append({
          sheetName: 'Sheet1',
          spreadsheetId: 'spreadsheet-123',
          values: [['value2']],
        });

        expect(mockSheets).toHaveBeenCalledTimes(1);
      });
    });
  });
});
