import * as z from 'zod';
import type { Model, ModelConstructor } from '@/types/index.js';

const schema = z.object({
  amount: z.number().positive().describe('the expense amount'),
  categories: z
    .array(
      z.enum([
        'appliances',
        'candomble',
        'car',
        'credit-allowance',
        'education',
        'entertainment',
        'food',
        'gifts',
        'health',
        'market',
        'monthly-expenses',
        'pets',
        'self-care',
        'subscriptions',
        'subscriptions-1-month',
        'subscriptions-3-months',
        'subscriptions-6-months',
        'subscriptions-1-year',
        'taxes',
        'transport',
        'work',
        'unrecognized',
      ]),
    )
    .min(1)
    .describe('the categories the expense fits in'),
  currency: z
    .literal('BRL')
    .describe('the currency used in the expense transaction'),
  description: z.string().trim().min(1).describe('the expense description'),
  messageId: z
    .number()
    .positive()
    .describe('the "messageId" sent by Telegram when processing the expense'),
  occurredAt: z.iso
    .date()
    .describe('the ISO date of when the expense happened'),
  paymentIdentifier: z
    .string()
    .trim()
    .min(1)
    .describe('the bank used in the expense transaction'),
  paymentMethod: z
    .enum(['pix', 'debit', 'credit', 'boleto'])
    .describe('the payment method used in the expense transction'),
  registeredAt: z.iso
    .datetime()
    .describe('the ISO datetime of when Telegram processed the expense'),
});

export type ExpenseProps = z.infer<typeof schema>;

export interface Expense extends Readonly<ExpenseProps> {}
export class Expense implements Model {
  static schema = schema;

  constructor(props: ExpenseProps) {
    const expense = Expense.schema.parse(props);
    Object.assign(this, expense);
  }

  toSpreadsheetRow() {
    return [
      this.occurredAt,
      this.amount,
      this.description,
      this.categories.join(','),
      this.paymentMethod,
      this.paymentIdentifier,
      this.currency,
      this.messageId,
      this.registeredAt,
    ];
  }
}

Expense satisfies ModelConstructor<ExpenseProps, Expense, typeof schema>;
