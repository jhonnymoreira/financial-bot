import * as services from '@/services/index.js';
import type { AppEnv, Services } from '@/types/index.js';

class MockAnthropicClient {}
class MockGoogleSheetsClient {}

vi.mock('@/clients/index.js', () => ({
  AnthropicClient: MockAnthropicClient,
  GoogleSheetsClient: MockGoogleSheetsClient,
}));

vi.mock('@/utils/index.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/index.js')>();
  return {
    ...original,
    getEnvironmentVariables: () => ({
      ALLOWED_CHAT_IDS: [123],
      ALLOWED_USER_IDS: [456],
      GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: 'credentials',
      SPREADSHEET_ID: 'spreadsheet-id',
      SPREADSHEET_BACKLOG_SHEET_NAME: 'backlog',
    }),
  };
});

function uncapitalize<T extends string>(str: T): Uncapitalize<T> {
  return str.replace(/^(.)/, (char) => char.toLowerCase()) as Uncapitalize<T>;
}

describe('middleware dependency injection: setup dependencies', () => {
  describe('services', () => {
    const servicesProperties = Object.keys(services) as (keyof Services)[];
    const mapping = servicesProperties.map((key) => ({
      property: uncapitalize(key),
      instance: key,
    }));

    test.each(mapping)('instantiates $property', async ({
      property,
      instance,
    }) => {
      const { setupDependencies } = await import(
        '@/middlewares/dependency-injection/setup-dependencies.js'
      );

      const dependencies = setupDependencies({
        TELEGRAM_BOT_TOKEN: {
          async get() {
            return 'value';
          },
        },
        TELEGRAM_WEBHOOK_SECRET_TOKEN: {
          async get() {
            return 'value';
          },
        },
        ANTHROPIC_API_KEY: {
          async get() {
            return 'value';
          },
        },
      } as unknown as AppEnv['Bindings']);

      expect(dependencies.services[property]).toBeInstanceOf(
        // biome-ignore lint/performance/noDynamicNamespaceImportAccess: it matters only outside of test scope
        services[instance],
      );
    });
  });
});
