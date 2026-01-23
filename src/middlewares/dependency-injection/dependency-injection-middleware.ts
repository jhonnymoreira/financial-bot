import { factory } from '@/factory.js';
import { setupDependencies } from './setup-dependencies.js';

export const dependencyInjectionMiddleware = factory.createMiddleware(
  async (context, next) => {
    const { services } = setupDependencies(context.env);
    context.set('services', services);

    return next();
  },
);
