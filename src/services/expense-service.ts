import type { AnthropicClient, GoogleSheetsClient } from '@/clients/index.js';
import { Expense } from '@/models/index.js';
import { getEnvironmentVariables, getISODate } from '@/utils/index.js';

type ExpenseServiceConfig = {
  clients: {
    anthropicClient: AnthropicClient;
    googleSheetsClient: GoogleSheetsClient;
  };
};

export class ExpenseService {
  readonly #clients: ExpenseServiceConfig['clients'];

  constructor({ clients }: ExpenseServiceConfig) {
    this.#clients = clients;
  }

  async registerExpense(expense: Expense) {
    const { SPREADSHEET_ID, SPREADSHEET_BACKLOG_SHEET_NAME } =
      getEnvironmentVariables();

    return await this.#clients.googleSheetsClient.append({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SPREADSHEET_BACKLOG_SHEET_NAME,
      values: [expense.toSpreadsheetRow()],
    });
  }

  async parseExpense({
    expense,
    metadata,
  }: {
    expense: string;
    metadata: {
      id: number;
      registeredAt: string;
    };
  }) {
    const context = this.#generateExpenseRegistrationContext({
      expense,
      metadata,
    });
    const parsedExpenseResponse = await this.#clients.anthropicClient.parse(
      context,
      Expense.schema,
    );

    return new Expense(parsedExpenseResponse);
  }

  #generateExpenseRegistrationContext({
    expense,
    metadata,
  }: {
    expense: string;
    metadata: {
      id: number;
      registeredAt: string;
    };
  }) {
    const currentDate = getISODate(new Date());

    return `Parse: "${metadata.id} ${metadata.registeredAt} ${currentDate} ${expense}"

FORMAT: {id} {registeredAt} {currentDate} {amount} {description} {temporal_ref} {payment_type} {provider} [category]

OUTPUT FIELDS:
- messageId: id (number)
- amount: numeric value
- currency: "BRL"
- registeredAt: as-is
- occurredAt: YYYY-MM-DD from currentDate + temporal_ref
- paymentType: débito→debit, crédito→credit, pix→pix, boleto→boleto
- paymentIdentifier: provider (capitalized)
- description: title case, STRIPPED of temporal refs (keep frequency: mensal, anual, trimestral)
- categories: array of strings, infer if not explicit

TEMPORAL REFS (calculate occurredAt, then DELETE from description):
hoje, ontem, anteontem, [N] dia(s) atrás, semana passada, mês passado, ano passado, segunda, terça, quarta, quinta, sexta, sábado, domingo

STRIPPING EXAMPLES:
"mercado hoje" → "Mercado"
"oxxo 3 dias atrás" → "Oxxo"
"oxxo (verduras) ontem" → "Oxxo (Verduras)"
"spotify mensal hoje" → "Spotify (Mensal)" [mensal kept, hoje removed]

CATEGORIES:
market: mercado,oxxo,sacolão,supermercado
food: restaurante,ifood,padaria,pastel
car: gasolina,posto,mecânico
health: farmácia,consulta,médico,dentista,plano de saúde
monthly-expenses: aluguel,conta,luz,água,internet,fatura,gás
candomble: candomblé,axé,ebó,charutos
entertainment: steam,jogo,show,cinema
taxes: iof,ipva,iptu,juros
transport: uber,99,taxi,metrô,estacionamento
pets: petz,ração,veterinário
gifts: presente,cesta básica
self-care: salão,barbeiro,academia
education: curso,livro,faculdade
appliances: eletrodoméstico,geladeira
work: créditos anthropic/openai/aws
credit-allowance: liberação de crédito
unrecognized: unclear

SUBSCRIPTIONS:
Entertainment (spotify,netflix,youtube,disney,hbo,prime): [subscriptions,entertainment]
Work (cursor,grammarly,github,claude,chatgpt): [subscriptions,work]
Education (coursera,udemy): [subscriptions,education]
+frequency: mensal→subscriptions-1-month, trimestral→subscriptions-3-months, anual→subscriptions-1-year
Usage-based (aws,cloudflare,vercel): [work] only

MULTI-CATEGORY: plano de saúde→[monthly-expenses,health] | juros unifor→[taxes,education]`;
  }
}
