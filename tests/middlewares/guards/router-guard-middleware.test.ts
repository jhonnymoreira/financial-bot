import { factory } from '@/factory.js';
import { routerGuardMiddleware } from '@/middlewares/guards/index.js';

const app = factory.createApp();
app.use(routerGuardMiddleware);
app.post('/webhook', async () => {
  return new Response('Cool response', { status: 200 });
});

describe('middleware guards: router guard', () => {
  describe('to avoid route sniffing', () => {
    test('returns 204 for all routes', async () => {
      expect.assertions(2);

      const response = await app.request('/');

      expect(response.status).toStrictEqual(204);
      expect(response.body).toBeNull();
    });

    describe('when the http method is not POST', () => {
      test('returns 204', async () => {
        expect.assertions(2);

        const response = await app.request('/webhook', { method: 'GET' });

        expect(response.status).toStrictEqual(204);
        expect(response.body).toBeNull();
      });
    });

    describe('when the route is `/webhook` and the http method is POST', () => {
      test('bypass the request', async () => {
        expect.assertions(2);

        const response = await app.request('/webhook', { method: 'POST' });

        expect(response.status).toStrictEqual(200);
        expect(await response.text()).toStrictEqual('Cool response');
      });
    });
  });
});
