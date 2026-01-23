import { createFactory } from 'hono/factory';
import type { AppEnv } from '@/types/index.js';

export const factory = createFactory<AppEnv>();
