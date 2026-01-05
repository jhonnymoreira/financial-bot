import { factory } from '@/factory.js';

export const authGuardMiddleware = factory.createMiddleware(
  async (context, next) => {
    const services = context.get('services');
    const secretToken = await services.secretsStoreService.getSecret(
      'TELEGRAM_WEBHOOK_SECRET_TOKEN',
    );
    if (!secretToken) {
      return new Response(null, { status: 500 });
    }

    const requestSecretToken = context.req.header(
      'X-Telegram-Bot-Api-Secret-Token',
    );
    if (requestSecretToken !== secretToken) {
      return new Response(null, { status: 401 });
    }

    return next();
  },
);
