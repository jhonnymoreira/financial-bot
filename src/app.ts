import { logger } from 'hono/logger';
import * as constants from '@/constants/index.js';
import { webhookHandler } from '@/handlers/index.js';
import * as middlewares from '@/middlewares/index.js';
import { factory } from './factory.js';

const app = factory.createApp();

app.use(logger());
app.use(middlewares.dependencyInjectionMiddleware({ constants }));
app.use(middlewares.guards.routerGuardMiddleware);
app.use(middlewares.guards.authGuardMiddleware);

app.post('/webhook', ...webhookHandler);

app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path} Error:`, err.message);
  console.error('Stack:', err.stack);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export { app };
