import { createFactory } from 'hono/factory';
import type { AppEnv } from '@/types/app-env.js';

export const factory = createFactory<AppEnv>();
