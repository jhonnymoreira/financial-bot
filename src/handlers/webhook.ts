import { factory } from '@/factory.js';
import * as middlewares from '@/middlewares/index.js';

export const webhookHandler = factory.createHandlers(
  middlewares.setupBotMiddleware,
  async (context) => {
    const bot = context.get('bot');
    const update = await context.req.json();
    console.log(JSON.stringify({ update }, null, 2));
    await bot.updates.handleUpdate(update);

    return new Response(null, { status: 204 });
  },
);
