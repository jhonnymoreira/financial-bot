import type { AppEnv } from '@/types/app-env.js';

export class SecretsStoreService {
  readonly #env: AppEnv['Bindings'];

  constructor(env: AppEnv['Bindings']) {
    this.#env = env;
  }

  async getSecret(secret: keyof AppEnv['Bindings']) {
    try {
      return await this.#env[secret].get();
    } catch {
      return null;
    }
  }
}
