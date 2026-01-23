import { logger } from 'hono/logger';
import { webhookHandler } from '@/handlers/index.js';
import * as middlewares from '@/middlewares/index.js';
import { factory } from './factory.js';

const app = factory.createApp();

app.use(logger());
app.use(middlewares.dependencyInjectionMiddleware);
app.use(middlewares.guards.routerGuardMiddleware);
app.use(middlewares.guards.authGuardMiddleware);

app.post('/webhook', ...webhookHandler);

app.onError((error, context) => {
  console.error(`[${context.req.method}] ${context.req.path} `, error.message);
  console.error(error.stack);
  return context.json({ error: 'Internal Server Error' }, 500);
});

export { app };
