import { SecretsStoreService } from '@/services/secrets-store-service.js';

const service = new SecretsStoreService({
  TELEGRAM_BOT_TOKEN: {
    get: async () => 'my-secret-value',
  },
  TELEGRAM_WEBHOOK_SECRET_TOKEN: {
    get: async () => {
      throw new Error();
    },
  },
});

describe('SecretsStoreService', () => {
  describe('async getSecret(secretName)', () => {
    test('returns the secret value', async () => {
      expect.assertions(1);

      const secretValue = await service.getSecret('TELEGRAM_BOT_TOKEN');

      expect(secretValue).toStrictEqual('my-secret-value');
    });

    describe('when the secret does not exist', () => {
      test('returns null', async () => {
        expect.assertions(1);

        const secretValue = await service.getSecret(
          'TELEGRAM_WEBHOOK_SECRET_TOKEN',
        );

        expect(secretValue).toBeNull();
      });
    });
  });
});
