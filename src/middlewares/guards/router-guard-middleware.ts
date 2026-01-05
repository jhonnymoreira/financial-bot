import { factory } from '@/factory.js';

export const routerGuardMiddleware = factory.createMiddleware(
  async (context, next) => {
    if (context.req.path !== '/webhook') {
      return new Response(null, { status: 204 });
    }

    if (context.req.method !== 'POST') {
      return new Response(null, { status: 204 });
    }

    return next();
  },
);
