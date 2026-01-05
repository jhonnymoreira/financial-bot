import type { Bot } from 'gramio';
import type { DependencyInjection } from './dependency-injection.js';

export interface AppEnv {
  Bindings: CloudflareBindings;
  Variables: { bot: Bot } & DependencyInjection;
}
