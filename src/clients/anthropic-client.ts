import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod.mjs';
import type * as z from 'zod';
import type { SecretsStoreService } from '@/services/secrets-store-service.js';

type AnthropicClientConfig = {
  services: {
    secretsStoreService: SecretsStoreService;
  };
  config: {
    model: Anthropic.Messages.Model;
  };
};

export class AnthropicClient {
  #client: Anthropic | undefined;

  readonly #model: Anthropic.Messages.Model;
  readonly #services: AnthropicClientConfig['services'];

  constructor({ services, config }: AnthropicClientConfig) {
    this.#services = services;
    this.#model = config.model;
  }

  async parse<Schema extends z.ZodType>(prompt: string, schema: Schema) {
    const client = await this.#getClient();

    const response = await client.beta.messages.parse({
      model: this.#model,
      max_tokens: 100,
      temperature: 0,
      betas: ['structured-outputs-2025-11-13'],
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      output_format: betaZodOutputFormat(schema),
    });

    if (!response.parsed_output) {
      throw new Error('[Anthropic Client] Unable to generate a parsed_output');
    }

    return response.parsed_output;
  }

  async #getClient() {
    if (!this.#client) {
      return await this.#createClient();
    }

    return this.#client;
  }

  async #createClient() {
    const apiKey =
      await this.#services.secretsStoreService.getSecret('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('[Anthropic Client] No API Key set');
    }

    this.#client = new Anthropic({ apiKey });

    return this.#client;
  }
}
