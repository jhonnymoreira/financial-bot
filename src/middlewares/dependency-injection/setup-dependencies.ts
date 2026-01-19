import type * as constants from '@/constants/index.js';
import * as services from '@/services/index.js';
import type { AppEnv } from '@/types/app-env.js';
import type { DependencyInjection } from '@/types/dependency-injection.js';

type Constants = typeof constants;

export function setupDependencies(
  env: AppEnv['Bindings'],
  { constants }: { constants: Constants },
): DependencyInjection {
  const secretsStoreService = new services.SecretsStoreService(env);
  const anthropicService = new services.AnthropicService(secretsStoreService);
  const googleSheetsService = new services.GoogleSheetsService({
    spreadsheetId: '1I957S-QuQwPCfejKT-_utbThES5MwXrE3GJNV4cD2Qo',
    sheetName: 'Backlog',
    serviceAccountCredentials: env.GOOGLE_SERVICE_ACCOUNT,
  });

  return {
    services: {
      anthropicService,
      botManagerService: new services.BotManagerService({
        chatsIds: constants.ALLOWED_CHATS_IDS,
        usersIds: constants.ALLOWED_USERS_IDS,
      }),
      googleSheetsService,
      secretsStoreService,
    },
  };
}
