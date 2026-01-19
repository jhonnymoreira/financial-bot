import * as constants from '@/constants/index.js';
import { setupDependencies } from '@/middlewares/dependency-injection/setup-dependencies.js';
import * as services from '@/services/index.js';
import type { Services } from '@/types/dependency-injection.js';

function uncaptalize<T extends string>(str: T): Uncapitalize<T> {
  return str.replace(/^(.)/, (char) => char.toLowerCase()) as Uncapitalize<T>;
}

const dependencies = setupDependencies(
  {
    ANTHROPIC_API_KEY: {
      async get() {
        return 'value';
      },
    },
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
    GOOGLE_SERVICE_ACCOUNT: 'value',
  },
  { constants },
);

describe('middleware dependency injection: setup dependencies', () => {
  describe('services', () => {
    const servicesProperties = Object.keys(services) as (keyof Services)[];
    const mapping = servicesProperties.map((key) => ({
      property: uncaptalize(key),
      instance: key,
    }));

    test.each(mapping)('instantiates $property', ({ property, instance }) => {
      expect(dependencies.services[property]).toBeInstanceOf(
        // biome-ignore lint/performance/noDynamicNamespaceImportAccess: it matters only outside of test scope
        services[instance],
      );
    });
  });
});
