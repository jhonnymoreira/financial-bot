import type { AppEnv } from '@/types/app-env.js';

type SecretsStoreKeys = {
  [Key in keyof AppEnv['Bindings']]: AppEnv['Bindings'][Key] extends SecretsStoreSecret
    ? Key
    : never;
}[keyof AppEnv['Bindings']];

export class SecretsStoreService {
  readonly #env: AppEnv['Bindings'];

  constructor(env: AppEnv['Bindings']) {
    this.#env = env;
  }

  async getSecret(secret: SecretsStoreKeys) {
    try {
      return await this.#env[secret].get();
    } catch {
      return null;
    }
  }
}
