import * as constants from '@/constants/index.js';
import { factory } from '@/factory.js';
import { dependencyInjectionMiddleware } from '@/middlewares/dependency-injection/dependency-injection-middleware.js';
import { authGuardMiddleware } from '@/middlewares/guards/index.js';

const app = factory.createApp();

app.use(dependencyInjectionMiddleware({ constants }));
app.use(authGuardMiddleware);

app.post('/webhook', async (context) => {
  return context.text('Authorized', 200);
});

describe('middleware guards: auth guard', () => {
  describe('when TELEGRAM_WEBHOOK_SECRET_TOKEN is not set', () => {
    test('returns 500', async () => {
      const request = await app.request(
        '/webhook',
        {
          method: 'POST',
          headers: {
            'X-Telegram-Bot-Api-Secret-Token': 'some-token',
          },
        },
        {
          TELEGRAM_WEBHOOK_SECRET_TOKEN: {
            get: async () => {
              throw new Error('Secret not found');
            },
          },
        },
      );

      expect(request.status).toBe(500);
    });
  });

  describe('when the secret token does not match', () => {
    test('returns 401', async () => {
      const request = await app.request(
        '/webhook',
        {
          method: 'POST',
          headers: {
            'X-Telegram-Bot-Api-Secret-Token': 'invalid-token',
          },
        },
        {
          TELEGRAM_WEBHOOK_SECRET_TOKEN: {
            get: async () => 'valid-secret',
          },
        },
      );

      expect(request.status).toBe(401);
    });
  });

  describe('when the secret token header is missing', () => {
    test('returns 401', async () => {
      const request = await app.request(
        '/webhook',
        {
          method: 'POST',
        },
        {
          TELEGRAM_WEBHOOK_SECRET_TOKEN: {
            get: async () => 'valid-secret',
          },
        },
      );

      expect(request.status).toBe(401);
    });
  });

  describe('when the secret token matches', () => {
    test('bypass the request', async () => {
      const request = await app.request(
        '/webhook',
        {
          method: 'POST',
          headers: {
            'X-Telegram-Bot-Api-Secret-Token': 'valid-secret',
          },
        },
        {
          TELEGRAM_WEBHOOK_SECRET_TOKEN: {
            get: async () => 'valid-secret',
          },
        },
      );

      expect(request.status).toBe(200);
      expect(await request.text()).toBe('Authorized');
    });
  });
});
