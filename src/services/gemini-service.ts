import { GoogleGenAI } from '@google/genai';
import type { Expense } from '@/types/expense.js';
import type { SecretsStoreService } from './secrets-store-service.js';

type RegisterExpenseParams = {
  id: number;
  expense: string;
  registeredAt: string;
};

export class GeminiService {
  #ai: GoogleGenAI | undefined;
  readonly #secretsStoreService: SecretsStoreService;
  readonly #model: string;

  constructor(secretsStoreService: SecretsStoreService) {
    this.#secretsStoreService = secretsStoreService;
    this.#model = 'gemini-2.0-flash-exp';
  }

  async parseRegisterExpense(params: RegisterExpenseParams): Promise<Expense> {
    const ai = await this.getAiClient();
    const contents = this.generateRegisterExpenseContext(params);

    const response = await ai.models.generateContent({
      model: this.#model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'number' },
            amount: { type: 'number' },
            currency: { type: 'string', enum: ['BRL'] },
            registeredAt: { type: 'string', format: 'date-time' },
            occurredAt: { type: 'string', format: 'date' },
            paymentType: {
              type: 'string',
              enum: ['pix', 'debit', 'credit', 'boleto'],
            },
            paymentIdentifier: { type: 'string' },
            message: { type: 'string' },
            category: { type: 'string' },
          },
          required: [
            'messageId',
            'amount',
            'currency',
            'registeredAt',
            'occurredAt',
            'paymentType',
            'paymentIdentifier',
            'message',
            'category',
          ],
        },
        maxOutputTokens: 256,
        temperature: 0,
      },
    });

    if (!response.text) {
      throw new Error('Unable to parse expense');
    }

    return JSON.parse(response.text);
  }

  private async getAiClient() {
    if (!this.#ai) {
      return await this.createAiClient();
    }

    return this.#ai;
  }

  private async createAiClient() {
    const apiKey = await this.#secretsStoreService.getSecret('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI: No API Key set');
    }

    this.#ai = new GoogleGenAI({ apiKey });

    return this.#ai;
  }

  private generateRegisterExpenseContext({
    id,
    expense,
    registeredAt,
  }: RegisterExpenseParams) {
    const currentDate = new Date().toISOString();

    return `Extract expense data from: "${id} ${registeredAt} ${currentDate} ${expense}"

Rules:
- messageId: use id as number
- amount: extract numeric value
- currency: always "BRL"
- registeredAt: use provided timestamp
- occurredAt: calculate from relative dates (hoje=today, ontem=yesterday, "X dias atrás"=subtract X days from currentDate)
- paymentType: map débito→debit, crédito→credit, pix→pix, boleto→boleto
- paymentIdentifier: capitalize provider name
- message: convert to title case
- category: infer from context (comma-separated if multiple). Use semantic understanding:
  * mercado/supermercado/compras → market
  * restaurante/lanchonete/bar/ifood → food
  * gasolina/posto/combustível/mecânico → car
  * farmácia/remédio/consulta → health
  * netflix/spotify/claude/cursor/amazon prime/assinatura → subscriptions
  * aluguel/conta/luz/água/internet → monthly-expenses
  * candomblé/axé/orixá/ebó → candomble
  * steam/jogo/ea/game → entertainment
  * iof/ipva/licenciamento → taxes
  * uber → transport
  * petz/felina/felinas → pets
  * liberação de crédito → credit-allowance
  If unclear, use "unrecognized"

Example:
Input: 47 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 22.35 ontem compras no mercado débito Nubank
Output: {"messageId":47,"amount":22.35,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-04","paymentType":"debit","paymentIdentifier":"Nubank","message":"Compras No Mercado","category":"market"}`.trim();
  }
}
