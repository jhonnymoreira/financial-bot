import type * as constants from '@/constants/index.js';
import * as services from '@/services/index.js';
import type { AppEnv } from '@/types/app-env.js';
import type { DependencyInjection } from '@/types/dependency-injection.js';

type Constants = typeof constants;

export function setupDependencies(
  env: AppEnv['Bindings'],
  { constants }: { constants: Constants },
): DependencyInjection {
  return {
    services: {
      botManagerService: new services.BotManagerService({
        chatsIds: constants.ALLOWED_CHATS_IDS,
        usersIds: constants.ALLOWED_USERS_IDS,
      }),
      secretsStoreService: new services.SecretsStoreService(env),
    },
  };
}
