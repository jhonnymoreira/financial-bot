import type { MiddlewareHandler } from 'hono';
import { factory } from '@/factory.js';
import type { AppEnv } from '@/types/index.js';

const mockHandleUpdate = vi.fn();
const mockBot = {
  updates: {
    handleUpdate: mockHandleUpdate,
  },
};

vi.mock('@/middlewares/index.js', () => ({
  setupBotMiddleware: (async (context, next) => {
    context.set('bot', mockBot as unknown as AppEnv['Variables']['bot']);
    return next();
  }) as MiddlewareHandler<AppEnv>,
}));

describe('handlers: webhook', () => {
  test('calls bot.updates.handleUpdate with the request body', async () => {
    const { webhookHandler } = await import('@/handlers/webhook.js');
    const app = factory.createApp();
    app.post('/webhook', ...webhookHandler);

    const update = { update_id: 123, message: { text: 'hello' } };
    await app.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    expect(mockHandleUpdate).toHaveBeenCalledWith(update);
  });

  test('returns 204', async () => {
    const { webhookHandler } = await import('@/handlers/webhook.js');
    const app = factory.createApp();
    app.post('/webhook', ...webhookHandler);

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ update_id: 123 }),
    });

    expect(response.status).toBe(204);
  });
});
