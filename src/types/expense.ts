import * as z from 'zod';

const categories = [
  'candomble',
  'car',
  'credit-allowance',
  'entertainment',
  'food',
  'health',
  'market',
  'monthly-expenses',
  'pets',
  'subscriptions',
  'taxes',
  'unrecognized',
] as const;

type Category = (typeof categories)[number];

export const expenseSchema = z.object({
  messageId: z.number(),
  amount: z.number(),
  currency: z.enum(['BRL']),
  registeredAt: z.iso.datetime(),
  occurredAt: z.iso.date(),
  paymentType: z.enum(['pix', 'debit', 'credit', 'boleto']),
  paymentIdentifier: z.string().min(1),
  message: z.string().min(1),
  category: z.string().refine(
    (val) => {
      const parts = val.split(',').map((s) => s.trim());
      return parts.every((category) =>
        categories.includes(category as Category),
      );
    },
    {
      error: `Category must be one, or more separated by comma, of the following: '${categories.join("' | '")}'`,
    },
  ),
});

export type Expense = z.infer<typeof expenseSchema>;
