import { factory } from '@/factory.js';

const mockServices = {
  botManagerService: {},
  expenseService: {},
  secretsStoreService: {},
};

vi.mock('@/middlewares/dependency-injection/setup-dependencies.js', () => ({
  setupDependencies: () => ({ services: mockServices }),
}));

describe('middleware dependency injection: dependency injection middleware', () => {
  test('sets services on context', async () => {
    const { dependencyInjectionMiddleware } = await import(
      '@/middlewares/dependency-injection/dependency-injection-middleware.js'
    );

    const app = factory.createApp();
    app.use(dependencyInjectionMiddleware);
    app.get('/test', (context) => {
      const services = context.get('services');
      return context.json(Object.keys(services));
    });

    const response = await app.request('/test');
    const body = await response.json();

    expect(body).toStrictEqual([
      'botManagerService',
      'expenseService',
      'secretsStoreService',
    ]);
  });

  test('calls next middleware', async () => {
    const { dependencyInjectionMiddleware } = await import(
      '@/middlewares/dependency-injection/dependency-injection-middleware.js'
    );

    const app = factory.createApp();
    app.use(dependencyInjectionMiddleware);
    app.get('/test', (context) => context.text('reached'));

    const response = await app.request('/test');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('reached');
  });
});
