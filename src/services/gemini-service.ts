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
    this.#model = 'gemini-2.5-flash';
  }

  async parseRegisterExpense(params: RegisterExpenseParams): Promise<Expense> {
    const ai = await this.getAiClient();
    const contents = this.generateRegisterExpenseContext(params);
    const response = await ai.models.generateContent({
      model: this.#model,
      contents,
    });

    if (!response.text) {
      throw new Error('Unable to parse expense');
    }

    try {
      return JSON.parse(response.text);
    } catch {
      console.log({ response: response.text });
      throw new Error('Unable to parse expense');
    }
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
    return `Parse to JSON: {id} {registeredAt} {currentDate} {amount} {date} {description} {type} {provider} {category}

- messageId: id (as number)
- amount: number
- currency: "BRL"
- registeredAt: ISO Timestamp
- occurredAt: ISO Date (hoje/ontem/"X dias atrás"→calculate the operation between the currentDate and the date)
- paymentType: débito→debit, crédito→credit, pix→pix, boleto→boleto
- paymentIdentifier: capitalize provider
- message: title case
- category: if category isn't present, analyze description context, choose one or more, separated by comma: monthly-expenses|food|market|candomble|subscriptions|car|health|entertainment|taxes|unrecognized
  Understand intent: cigarro→addiction, mercado/supermercado/compras→market, restaurante/lanchonete/bar/ifood→food, gasolina/posto/combustível/mecânico→car, farmácia/remédio/consulta→health, netflix/spotify/claude/cursor/amazon prime/assinatura→subscriptions, aluguel/conta/luz/água/internet→monthly-expenses, candomblé/axé/orixá/ebó→candomble, steam/jogo/ea/game→entertainment, iof→taxes, ipva→taxes,car, licensiamento do carro→taxes,car, felina/felinas/petz→pets, liberação de crédito→credit-allowance
  Use semantic understanding, not just keywords
  If category is present, standardize it

Example:
47 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 22.35 ontem compras no mercado débito Nubank
→{"messageId":47,"amount":22.35,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-04","paymentType":"debit","paymentIdentifier":"Nubank","message":"Compras no Mercado","category":"market"}

Parse (raw JSON only, no markdown, no code blocks, just text):
${id} ${registeredAt} ${new Date().toISOString()} ${expense}`.trim();
  }
}
