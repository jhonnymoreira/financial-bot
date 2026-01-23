vi.mock('hono/logger', () => ({
  logger: () => vi.fn((_, next) => next()),
}));

vi.mock('@/middlewares/index.js', () => ({
  dependencyInjectionMiddleware: vi.fn((_, next) => next()),
  guards: {
    routerGuardMiddleware: vi.fn((_, next) => next()),
    authGuardMiddleware: vi.fn((_, next) => next()),
  },
}));

vi.mock('@/handlers/index.js', () => ({
  webhookHandler: [
    async () => {
      throw new Error('Test error');
    },
  ],
}));

describe('app', () => {
  describe('onError', () => {
    test('returns 500 with error message', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const { app } = await import('@/app.js');

      const response = await app.request('/webhook', { method: 'POST' });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toStrictEqual({ error: 'Internal Server Error' });
      expect(consoleError).toHaveBeenCalledWith(
        '[POST] /webhook ',
        'Test error',
      );
    });
  });
});
