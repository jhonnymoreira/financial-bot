import { setupBot } from '@/bot/setup-bot.js';
import { factory } from '@/factory.js';

export const setupBotMiddleware = factory.createMiddleware(
  async (context, next) => {
    const services = context.get('services');
    const bot = await setupBot({ services });
    if (!bot) {
      return new Response(null, { status: 500 });
    }

    context.set('bot', bot);

    return next();
  },
);
