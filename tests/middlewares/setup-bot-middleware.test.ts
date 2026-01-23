import type { MiddlewareHandler } from 'hono';
import { factory } from '@/factory.js';
import type { AppEnv } from '@/types/index.js';

const { mockSetupBot } = vi.hoisted(() => {
  const mockSetupBot = vi.fn();
  return { mockSetupBot };
});

vi.mock('@/bot/setup-bot.js', () => ({
  setupBot: mockSetupBot,
}));

const mockServices = {
  botManagerService: {},
  expenseService: {},
  secretsStoreService: {},
};

function createApp() {
  const app = factory.createApp();

  const mockDependencyInjection: MiddlewareHandler<AppEnv> = async (
    context,
    next,
  ) => {
    context.set(
      'services',
      mockServices as unknown as AppEnv['Variables']['services'],
    );
    return next();
  };

  app.use(mockDependencyInjection);

  return app;
}

describe('middleware: setup bot', () => {
  describe('when setupBot returns a bot', () => {
    test('sets the bot on context and calls next', async () => {
      const { setupBotMiddleware } = await import(
        '@/middlewares/setup-bot-middleware.js'
      );
      const mockBot = { handleUpdate: vi.fn() };
      mockSetupBot.mockResolvedValue(mockBot);

      const app = createApp();
      app.use(setupBotMiddleware);
      app.get('/test', (context) => {
        const bot = context.get('bot');
        return context.json({ hasBot: !!bot });
      });

      const response = await app.request('/test');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toStrictEqual({ hasBot: true });
    });

    test('calls setupBot with services', async () => {
      const { setupBotMiddleware } = await import(
        '@/middlewares/setup-bot-middleware.js'
      );
      const mockBot = { handleUpdate: vi.fn() };
      mockSetupBot.mockResolvedValue(mockBot);

      const app = createApp();
      app.use(setupBotMiddleware);
      app.get('/test', (context) => context.text('ok'));

      await app.request('/test');

      expect(mockSetupBot).toHaveBeenCalledWith({ services: mockServices });
    });
  });

  describe('when setupBot returns null', () => {
    test('returns 500', async () => {
      const { setupBotMiddleware } = await import(
        '@/middlewares/setup-bot-middleware.js'
      );
      mockSetupBot.mockResolvedValue(null);

      const app = createApp();
      app.use(setupBotMiddleware);
      app.get('/test', (context) => context.text('ok'));

      const response = await app.request('/test');

      expect(response.status).toBe(500);
    });
  });
});
