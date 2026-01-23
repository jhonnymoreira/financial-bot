import * as clients from '@/clients/index.js';
import * as services from '@/services/index.js';
import type { AppEnv, DependencyInjection } from '@/types/index.js';
import { getEnvironmentVariables } from '@/utils/index.js';

export function setupDependencies(
  bindings: AppEnv['Bindings'],
): DependencyInjection {
  const env = getEnvironmentVariables();

  const secretsStoreService = new services.SecretsStoreService(bindings);

  const anthropicClient = new clients.AnthropicClient({
    services: {
      secretsStoreService,
    },
    config: {
      model: 'claude-haiku-4-5-20251001',
    },
  });
  const googleSheetsClient = new clients.GoogleSheetsClient({
    serviceAccountCredentials: env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
  });

  return {
    services: {
      botManagerService: new services.BotManagerService({
        allowList: {
          chats: env.ALLOWED_CHAT_IDS,
          users: env.ALLOWED_USER_IDS,
        },
      }),
      expenseService: new services.ExpenseService({
        clients: {
          anthropicClient: anthropicClient,
          googleSheetsClient: googleSheetsClient,
        },
      }),
      secretsStoreService,
    },
  };
}
