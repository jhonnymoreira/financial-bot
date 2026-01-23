import { Expense, type ExpenseProps } from '@/models/index.js';

const expenseProps: ExpenseProps = {
  amount: 777,
  categories: ['monthly-expenses'],
  currency: 'BRL',
  description: 'Aluguel',
  messageId: 7,
  occurredAt: '2026-01-23',
  paymentIdentifier: 'Random bank',
  paymentMethod: 'pix',
  registeredAt: '2026-01-23T04:10:13.140Z',
};

describe('models: Expense', () => {
  describe('properties', () => {
    const expense = new Expense(expenseProps);

    test('amount', () => {
      expect(expense).toHaveProperty('amount', 777);
    });

    test('categories', () => {
      expect(expense).toHaveProperty('categories', ['monthly-expenses']);
    });

    test('currency', () => {
      expect(expense).toHaveProperty('currency', 'BRL');
    });

    test('description', () => {
      expect(expense).toHaveProperty('description', 'Aluguel');
    });

    test('messageId', () => {
      expect(expense).toHaveProperty('messageId', 7);
    });

    test('occurredAt', () => {
      expect(expense).toHaveProperty('occurredAt', '2026-01-23');
    });

    test('paymentIdentifier', () => {
      expect(expense).toHaveProperty('paymentIdentifier', 'Random bank');
    });

    test('paymentMethod', () => {
      expect(expense).toHaveProperty('paymentMethod', 'pix');
    });

    test('registeredAt', () => {
      expect(expense).toHaveProperty(
        'registeredAt',
        '2026-01-23T04:10:13.140Z',
      );
    });
  });

  describe('validations', () => {
    describe('amount', () => {
      test('must be positive', () => {
        expect(() => {
          new Expense({ ...expenseProps, amount: -1 });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('categories', () => {
      test('must be at least one of the supported categories', () => {
        expect(() => {
          // @ts-expect-error
          new Expense({ ...expenseProps, categories: ['invalid-category'] });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('description', () => {
      test('must be a string with at least 1 non-space character', () => {
        expect(() => {
          new Expense({ ...expenseProps, description: '             ' });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('messageId', () => {
      test('must be a positive number', () => {
        expect(() => {
          new Expense({ ...expenseProps, messageId: -1 });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('occurredAt', () => {
      test('must be a valid ISO date', () => {
        expect(() => {
          new Expense({ ...expenseProps, occurredAt: '2026/12/12' });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('paymentIdentifier', () => {
      test('must be a string with at least 1 non-space character', () => {
        expect(() => {
          new Expense({ ...expenseProps, paymentIdentifier: '             ' });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('paymentMethod', () => {
      test('must be one of the supported payment methods', () => {
        expect(() => {
          new Expense({
            ...expenseProps,
            // @ts-expect-error
            paymentMethod: 'invalid-payment-method',
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('registeredAt', () => {
      test('must be a valid ISO date time', () => {
        expect(() => {
          new Expense({ ...expenseProps, registeredAt: '2026/12/12' });
        }).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('methods', () => {
    describe('toSpreadsheetRow()', () => {
      test('transforms the data to be saved as a spreadsheet row', () => {
        const expense = new Expense(expenseProps);
        expect(expense.toSpreadsheetRow()).toMatchSnapshot();
      });
    });
  });
});
