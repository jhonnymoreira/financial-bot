import Anthropic from '@anthropic-ai/sdk';
import * as z from 'zod';
import { type Expense, expenseSchema } from '@/types/expense.js';
import type { SecretsStoreService } from './secrets-store-service.js';
import { getISODate } from '@/utils/index.js';

type RegisterExpenseParams = {
  id: number;
  expense: string;
  registeredAt: string;
};

export class AnthropicService {
  #ai: Anthropic | undefined;
  readonly #secretsStoreService: SecretsStoreService;
  readonly #model: Anthropic.Messages.Model;

  constructor(secretsStoreService: SecretsStoreService) {
    this.#secretsStoreService = secretsStoreService;
    this.#model = 'claude-haiku-4-5';
  }

  async parseExpense(params: RegisterExpenseParams): Promise<Expense> {
    const client = await this.getAiClient();
    const content = this.generateRegisterExpenseContext(params);

    const response = await client.beta.messages.parse({
      model: this.#model,
      max_tokens: 100,
      temperature: 0,
      betas: ['structured-outputs-2025-11-13'],
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      output_format: {
        type: 'json_schema',
        schema: expenseSchema.toJSONSchema(),
      },
    });

    try {
      return expenseSchema.parse(response.parsed_output);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(JSON.stringify(z.treeifyError(error), null, 2));
        throw new Error('Response is not a valid expense');
      }

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
    const apiKey =
      await this.#secretsStoreService.getSecret('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC: No API Key set');
    }

    this.#ai = new Anthropic({ apiKey });

    return this.#ai;
  }

  private generateRegisterExpenseContext({
    id,
    expense,
    registeredAt,
  }: RegisterExpenseParams) {
    const currentDate = getISODate(new Date());

    return `Parse expense: "${id} ${registeredAt} ${currentDate} ${expense}"

  INPUT: {id} {registeredAt} {currentDate} {amount} {description} {temporal_ref} {payment_type} {provider} [category]

  FIELDS:
  - messageId: id as number
  - amount: numeric value only
  - currency: "BRL"
  - registeredAt: use as-is
  - occurredAt: calculate YYYY-MM-DD from currentDate + temporal_ref (hoje=today, ontem=yesterday, X dias atrás=X days ago, semana passada=7 days ago)
  - paymentType: débito→debit, crédito→credit, pix→pix, boleto→boleto
  - paymentIdentifier: capitalize provider
  - message: title case, WHAT was purchased (exclude temporal words), include frequency if present (mensal/anual)
  - category: use explicit if provided, else infer (comma-separated)

  CATEGORIES:
  market: mercado,supermercado,oxxo,extra,carrefour,assai,coop,sacolão
  food: restaurante,ifood,rappi,padaria,mcdonalds,pizzaria,starbucks,pastel
  car: gasolina,posto,combustível,mecânico,oficina
  health: farmácia,remédio,consulta,médico,dentista,psicólogo,plano de saúde
  monthly-expenses: aluguel,conta,luz,água,internet,fatura,gás,parcela carro
  candomble: candomblé,axé,orixá,ebó,ile,xango,egun,charutos,quiabo de xango
  entertainment: steam,jogo,game,show,cinema,ingresso
  taxes: iof,ipva,licenciamento,iptu,juros
  transport: uber,99,taxi,ônibus,metrô,passagem,estacionamento
  pets: petz,cobasi,ração,veterinário,areia
  gifts: presente,cesta básica
  self-care: salão,barbeiro,manicure,academia(gym)
  education: curso,livro,escola,faculdade,unifor,academia de beats
  appliances: eletrodoméstico,eletrônico,torradeira,geladeira
  work: work expenses,créditos(anthropic/openai/aws)
  credit-allowance: liberação de crédito
  unrecognized: unclear context

  SUBSCRIPTIONS:
  Entertainment (spotify,netflix,paramount,prime,youtube,disney,hbo): subscriptions,entertainment
  Work (cursor,grammarly,github,claude,chatgpt): subscriptions,work
  Education (coursera,udemy,business elite): subscriptions,education
  +frequency if explicit: mensal→subscriptions-1-month, trimestral→subscriptions-3-months, semestral→subscriptions-6-months, anual→subscriptions-1-year
  Usage-based (aws,cloudflare,vercel): work only (NOT subscription)
  Credits (créditos X): work only

  MULTI-CATEGORY: plano de saúde→monthly-expenses,health | juros unifor→taxes,education | iof cursor→taxes,subscriptions,work

  EXAMPLES:
  Input: 47 2026-01-05T01:47:39.943Z 2026-01-05 22.35 compras no mercado ontem débito nubank
  Output: {"messageId":47,"amount":22.35,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-04","paymentType":"debit","paymentIdentifier":"Nubank","message":"Compras No Mercado","category":"market"}

  Input: 50 2026-01-05T01:47:39.943Z 2026-01-05 31.90 spotify mensal hoje débito nubank
  Output: {"messageId":50,"amount":31.90,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"debit","paymentIdentifier":"Nubank","message":"Spotify (Mensal)","category":"subscriptions,subscriptions-1-month,entertainment"}

  Input: 55 2026-01-05T01:47:39.943Z 2026-01-05 45.00 oxxo 3 dias atrás débito nubank
  Output: {"messageId":55,"amount":45.00,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-02","paymentType":"debit","paymentIdentifier":"Nubank","message":"Oxxo","category":"market"}`;
  }
}
