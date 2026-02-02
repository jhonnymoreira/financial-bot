import type { AnthropicClient, GoogleSheetsClient } from '@/clients/index.js';
import { Expense, type ExpenseProps } from '@/models/index.js';
import { ExpenseService } from '@/services/index.js';

vi.mock('@/utils/index.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/index.js')>();
  return {
    ...original,
    getEnvironmentVariables: () => ({
      SPREADSHEET_ID: 'test-spreadsheet-id',
      SPREADSHEET_BACKLOG_SHEET_NAME: 'test-backlog',
    }),
    getISODate: () => '2026-01-23',
  };
});

const expenseProps: ExpenseProps = {
  amount: 100,
  categories: ['market'],
  currency: 'BRL',
  description: 'Mercado',
  messageId: 1,
  occurredAt: '2026-01-23',
  paymentIdentifier: 'Nubank',
  paymentMethod: 'debit',
  registeredAt: '2026-01-23T10:00:00.000Z',
};

describe('ExpenseService', () => {
  describe('registerExpense(expense)', () => {
    test('calls googleSheetsClient.append with correct parameters', async () => {
      const append = vi.fn().mockResolvedValue(true);
      const googleSheetsClient = { append } as unknown as GoogleSheetsClient;
      const anthropicClient = {} as unknown as AnthropicClient;

      const service = new ExpenseService({
        clients: { anthropicClient, googleSheetsClient },
      });
      const expense = new Expense(expenseProps);

      await service.registerExpense(expense);

      expect(append).toHaveBeenCalledWith({
        spreadsheetId: 'test-spreadsheet-id',
        sheetName: 'test-backlog',
        values: [expense.toSpreadsheetRow()],
      });
    });

    test('returns the result from googleSheetsClient.append', async () => {
      const append = vi.fn().mockResolvedValue(true);
      const googleSheetsClient = { append } as unknown as GoogleSheetsClient;
      const anthropicClient = {} as unknown as AnthropicClient;

      const service = new ExpenseService({
        clients: { anthropicClient, googleSheetsClient },
      });
      const expense = new Expense(expenseProps);

      const result = await service.registerExpense(expense);

      expect(result).toBeTruthy();
    });
  });

  describe('parseExpense({ expense, metadata })', () => {
    const { messageId, registeredAt, ...parsedProps } = expenseProps;

    test('calls anthropicClient.parse with generated context and parsing schema', async () => {
      const parse = vi.fn().mockResolvedValue(parsedProps);
      const anthropicClient = { parse } as unknown as AnthropicClient;
      const googleSheetsClient = {} as unknown as GoogleSheetsClient;

      const service = new ExpenseService({
        clients: { anthropicClient, googleSheetsClient },
      });

      await service.parseExpense({
        expense: '100 mercado hoje débito nubank',
        metadata: { id: 1, registeredAt: '2026-01-23T10:00:00.000Z' },
      });

      expect(parse).toHaveBeenCalledWith(
        expect.stringContaining(
          'Parse: "2026-01-23 100 mercado hoje débito nubank"',
        ),
        Expense.parsingSchema,
      );
    });

    test('returns an Expense instance with metadata merged', async () => {
      const parse = vi.fn().mockResolvedValue(parsedProps);
      const anthropicClient = { parse } as unknown as AnthropicClient;
      const googleSheetsClient = {} as unknown as GoogleSheetsClient;

      const service = new ExpenseService({
        clients: { anthropicClient, googleSheetsClient },
      });

      const result = await service.parseExpense({
        expense: '100 mercado hoje débito nubank',
        metadata: { id: 1, registeredAt: '2026-01-23T10:00:00.000Z' },
      });

      expect(result).toBeInstanceOf(Expense);
      expect(result.messageId).toBe(1);
      expect(result.registeredAt).toBe('2026-01-23T10:00:00.000Z');
    });
  });
});
