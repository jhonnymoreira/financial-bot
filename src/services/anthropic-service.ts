import Anthropic from '@anthropic-ai/sdk';
import * as z from 'zod';
import { type Expense, expenseSchema } from '@/types/expense.js';
import type { SecretsStoreService } from './secrets-store-service.js';

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
    const currentDate = new Date().toISOString();

    return `Extract expense data from: "${id} ${registeredAt} ${currentDate} ${expense}"
    
    INPUT FORMAT:
    {amount} {description} {date_reference} {payment_type} {provider} {category}
    
    FIELD EXTRACTION RULES:
    - messageId: use id as number
    - amount: extract numeric value only
    - currency: always "BRL"
    - registeredAt: use provided timestamp as-is
    - occurredAt: calculate ISO date from date_reference
      * hoje → today's date
      * ontem → yesterday's date
      * "X dias atrás" → subtract X days from currentDate
    - paymentType: exact mapping required
      * débito → debit
      * crédito → credit
      * pix → pix
      * boleto → boleto
    - paymentIdentifier: capitalize provider name (e.g., "nubank" → "Nubank")
    - message: extract description in title case
      * Include frequency if mentioned (e.g., "Spotify (Mensal)")
      * DO NOT include date references (hoje/ontem/dias atrás)
      * Keep other context (e.g., "Oxxo (Cigarros + Toddynho)")
    - category: if explicitly provided at the end of input, use and standardize it; otherwise infer from context (see rules below)
    
    CATEGORY RULES:
    If category is explicitly mentioned at the end of the input, validate and standardize it to match valid categories below.
    Otherwise, use semantic understanding to assign comma-separated categories.
    
    VALID CATEGORIES:
    appliances, candomble, car, credit-allowance, education, entertainment, food, gifts, health, market, monthly-expenses, pets, self-care, subscriptions, subscriptions-1-month, subscriptions-3-months, subscriptions-6-months, subscriptions-1-year, taxes, transport, work, unrecognized
    
    BASIC CATEGORIES (single or with combinations):
    - market: mercado, supermercado, compras, oxxo, extra, carrefour, assai, coop, sacolão
    - food: restaurante, lanchonete, bar, ifood, rappi, padaria, mcdonalds, pizzaria, starbucks, confeitaria, pastel, caldo de cana
    - car: gasolina, posto, combustível, mecânico, oficina, estacionamento (when for parking)
    - health: farmácia, remédio, consulta, médico, dentista, psicólogo, psicóloga, plano de saúde, exame
    - monthly-expenses: aluguel, conta, luz, água, internet, fatura, gás, energia, claro, vivo, seguro celular, parcela carro
    - candomble: candomblé, axé, orixá, ebó, ile, ilê, xango, xangô, egun, entidades, charutos (when for religious use), quiabo de xango, contribuição oro
    - entertainment: steam, jogo, ea, game, show, cinema, ingresso, nuuvem, arc raiders, overcooked
    - taxes: iof, ipva, licenciamento, iptu, juros de atraso (combine with related category, e.g., "taxes,education" for education late fees)
    - transport: uber, 99, taxi, ônibus, metrô, passagem, estacionamento (when for transportation)
    - pets: petz, cobasi, felina, felinas, ração, veterinário, areia, cone, gel
    - gifts: presente, cesta básica
    - self-care: salão, barbeiro, manicure, spa, academia (gym), perfumaria
    - education: curso, livro, escola, faculdade, unifor, puc, material escolar, business elite, academia de beats (online courses)
    - appliances: eletrodoméstico, eletrônico, torradeira, filtro de água, geladeira
    - work: standalone usage for work-related expenses without subscription pattern
    - credit-allowance: liberação de crédito
    - unrecognized: when context is unclear
    
    SUBSCRIPTION SERVICES (multi-category tagging):
    For recurring subscription services, use this pattern:
    1. Always include base service type: entertainment OR work OR education
    2. Add "subscriptions" if it's clearly a subscription
    3. Add frequency tag ONLY if explicitly mentioned in description:
       * mensal, (mensal), monthly, mês → subscriptions-1-month
       * trimestral, (trimestral), quarterly, 3 meses → subscriptions-3-months
       * semestral, 6 meses → subscriptions-6-months
       * anual, (anual), yearly, ano → subscriptions-1-year
    
    ENTERTAINMENT SUBSCRIPTIONS:
    - spotify, netflix, paramount, amazon prime, youtube premium, crunchyroll, disney+, hbo
    - Without frequency: "subscriptions,entertainment"
    - With frequency: "subscriptions,subscriptions-{frequency},entertainment"
    
    WORK SUBSCRIPTIONS:
    - cursor, grammarly, linkedin premium, github, claude, chatgpt, openai, anthropic
    - Without frequency: "subscriptions,work"
    - With frequency: "subscriptions,subscriptions-{frequency},work"
    
    EDUCATION SUBSCRIPTIONS:
    - coursera, udemy, business elite, academia de beats (online course platforms)
    - Without frequency: "subscriptions,education"
    - With frequency: "subscriptions,subscriptions-{frequency},education"
    
    USAGE-BASED SERVICES (NOT subscriptions):
    - aws, cloudflare, vercel, digital ocean → "work" only
    - These are pay-as-you-go, not subscriptions
    
    IOF ON SUBSCRIPTIONS:
    - When IOF appears for a subscription service (e.g., "IOF - Cursor")
    - Use: "taxes,subscriptions,work" or "taxes,subscriptions,entertainment"
    
    MULTI-CATEGORY EXAMPLES:
    - "Plano de Saúde" → "monthly-expenses,health"
    - "Juros - Unifor" → "taxes,education"
    - "Parcela do Carro" → "monthly-expenses,car"
    - "Estacionamento (Shopping)" → "transport" (parking for going somewhere)
    
    RESPONSE EXAMPLES:
    
    Example 1 - Basic expense (inferred category):
    Input: 47 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 22.35 compras no mercado ontem débito nubank
    Output: {"messageId":47,"amount":22.35,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-04","paymentType":"debit","paymentIdentifier":"Nubank","message":"Compras No Mercado","category":"market"}
    
    Example 2 - Explicit category provided:
    Input: 48 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 50.00 compras hoje débito Nubank entertainment
    Output: {"messageId":48,"amount":50.00,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"debit","paymentIdentifier":"Nubank","message":"Compras","category":"entertainment"}
    
    Example 3 - Subscription WITH frequency:
    Input: 49 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 31.90 spotify mensal hoje débito nubank
    Output: {"messageId":49,"amount":31.90,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"debit","paymentIdentifier":"Nubank","message":"Spotify (Mensal)","category":"subscriptions,subscriptions-1-month,entertainment"}
    
    Example 4 - Subscription WITHOUT frequency:
    Input: 50 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 31.90 spotify hoje débito nubank
    Output: {"messageId":50,"amount":31.90,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"debit","paymentIdentifier":"Nubank","message":"Spotify","category":"subscriptions,entertainment"}
    
    Example 5 - Usage-based service (NOT subscription):
    Input: 51 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 3.13 aws hoje crédito neon
    Output: {"messageId":51,"amount":3.13,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"credit","paymentIdentifier":"Neon","message":"AWS","category":"work"}
    
    Example 6 - Multi-category (inferred):
    Input: 52 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 1990.00 plano de saúde hoje pix nubank
    Output: {"messageId":52,"amount":1990.00,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"pix","paymentIdentifier":"Nubank","message":"Plano De Saúde","category":"monthly-expenses,health"}
    
    Example 7 - IOF on subscription:
    Input: 53 2026-01-05T01:47:39.943Z 2026-01-05T01:47:39.943Z 4.03 iof - cursor hoje crédito neon
    Output: {"messageId":53,"amount":4.03,"currency":"BRL","registeredAt":"2026-01-05T01:47:39.943Z","occurredAt":"2026-01-05","paymentType":"credit","paymentIdentifier":"Neon","message":"IOF - Cursor","category":"taxes,subscriptions,work"}`.trim();
  }
}
