import type { MiddlewareHandler } from 'hono';
import { factory } from '@/factory.js';
import { authGuardMiddleware } from '@/middlewares/guards/index.js';
import type { AppEnv } from '@/types/index.js';

function createApp(secretsStoreService: {
  getSecret: () => Promise<string | null>;
}) {
  const app = factory.createApp();

  const mockDependencyInjection: MiddlewareHandler<AppEnv> = async (
    context,
    next,
  ) => {
    context.set('services', {
      secretsStoreService,
    } as unknown as AppEnv['Variables']['services']);
    return next();
  };

  app.use(mockDependencyInjection);
  app.use(authGuardMiddleware);
  app.post('/webhook', (context) => context.text('Authorized', 200));

  return app;
}

describe('middleware guards: auth guard', () => {
  describe('when TELEGRAM_WEBHOOK_SECRET_TOKEN is not set', () => {
    test('returns 500', async () => {
      const app = createApp({ getSecret: async () => null });

      const response = await app.request('/webhook', {
        method: 'POST',
        headers: { 'X-Telegram-Bot-Api-Secret-Token': 'some-token' },
      });

      expect(response.status).toBe(500);
    });
  });

  describe('when the secret token does not match', () => {
    test('returns 401', async () => {
      const app = createApp({ getSecret: async () => 'valid-secret' });

      const response = await app.request('/webhook', {
        method: 'POST',
        headers: { 'X-Telegram-Bot-Api-Secret-Token': 'invalid-token' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('when the secret token header is missing', () => {
    test('returns 401', async () => {
      const app = createApp({ getSecret: async () => 'valid-secret' });

      const response = await app.request('/webhook', { method: 'POST' });

      expect(response.status).toBe(401);
    });
  });

  describe('when the secret token matches', () => {
    test('allows the request through', async () => {
      const app = createApp({ getSecret: async () => 'valid-secret' });

      const response = await app.request('/webhook', {
        method: 'POST',
        headers: { 'X-Telegram-Bot-Api-Secret-Token': 'valid-secret' },
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Authorized');
    });
  });
});
