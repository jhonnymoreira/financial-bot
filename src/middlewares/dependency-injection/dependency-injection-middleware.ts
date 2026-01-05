import type * as constants from '@/constants/index.js';
import { factory } from '@/factory.js';
import { setupDependencies } from './setup-dependencies.js';

type Constants = typeof constants;

export const dependencyInjectionMiddleware = ({
  constants,
}: {
  constants: Constants;
}) =>
  factory.createMiddleware(async (context, next) => {
    const { services } = setupDependencies(context.env, { constants });
    context.set('services', services);

    return next();
  });
