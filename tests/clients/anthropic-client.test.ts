import * as z from 'zod';
import { AnthropicClient } from '@/clients/anthropic-client.js';
import type { SecretsStoreService } from '@/services/secrets-store-service.js';

const { mockParse, mockBetaZodOutputFormat } = vi.hoisted(() => {
  const mockParse = vi.fn();
  const mockBetaZodOutputFormat = vi.fn((schema) => ({ schema }));
  return { mockParse, mockBetaZodOutputFormat };
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    beta: {
      messages: {
        parse: mockParse,
      },
    },
  })),
}));

vi.mock('@anthropic-ai/sdk/helpers/beta/zod.mjs', () => ({
  betaZodOutputFormat: mockBetaZodOutputFormat,
}));

const createSecretsStoreService = (apiKey: string | null) =>
  ({
    getSecret: vi.fn().mockResolvedValue(apiKey),
  }) as unknown as SecretsStoreService;

describe('AnthropicClient', () => {
  describe('parse(prompt, schema)', () => {
    test('calls client.beta.messages.parse with correct parameters', async () => {
      mockParse.mockResolvedValue({ parsed_output: { name: 'test' } });
      const secretsStoreService = createSecretsStoreService('test-api-key');
      const client = new AnthropicClient({
        services: { secretsStoreService },
        config: { model: 'claude-haiku-4-5-20251001' },
      });
      const schema = z.object({ name: z.string() });

      await client.parse('test prompt', schema);

      expect(mockParse).toHaveBeenCalledWith({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        temperature: 0,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{ role: 'user', content: 'test prompt' }],
        output_format: { schema },
      });
    });

    test('returns the parsed_output', async () => {
      mockParse.mockResolvedValue({ parsed_output: { name: 'result' } });
      const secretsStoreService = createSecretsStoreService('test-api-key');
      const client = new AnthropicClient({
        services: { secretsStoreService },
        config: { model: 'claude-haiku-4-5-20251001' },
      });
      const schema = z.object({ name: z.string() });

      const result = await client.parse('test prompt', schema);

      expect(result).toStrictEqual({ name: 'result' });
    });

    describe('when parsed_output is null', () => {
      test('throws an error', async () => {
        mockParse.mockResolvedValue({ parsed_output: null });
        const secretsStoreService = createSecretsStoreService('test-api-key');
        const client = new AnthropicClient({
          services: { secretsStoreService },
          config: { model: 'claude-haiku-4-5-20251001' },
        });
        const schema = z.object({ name: z.string() });

        await expect(client.parse('test prompt', schema)).rejects.toThrow(
          '[Anthropic Client] Unable to generate a parsed_output',
        );
      });
    });

    describe('when API key is not set', () => {
      test('throws an error', async () => {
        const secretsStoreService = createSecretsStoreService(null);
        const client = new AnthropicClient({
          services: { secretsStoreService },
          config: { model: 'claude-haiku-4-5-20251001' },
        });
        const schema = z.object({ name: z.string() });

        await expect(client.parse('test prompt', schema)).rejects.toThrow(
          '[Anthropic Client] No API Key set',
        );
      });
    });

    describe('when called multiple times', () => {
      test('reuses the same client instance', async () => {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        mockParse.mockResolvedValue({ parsed_output: { name: 'test' } });
        const secretsStoreService = createSecretsStoreService('test-api-key');
        const client = new AnthropicClient({
          services: { secretsStoreService },
          config: { model: 'claude-haiku-4-5-20251001' },
        });
        const schema = z.object({ name: z.string() });

        await client.parse('prompt 1', schema);
        await client.parse('prompt 2', schema);

        expect(Anthropic).toHaveBeenCalledTimes(1);
      });
    });
  });
});
