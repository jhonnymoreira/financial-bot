import { Bot } from 'gramio';
import type { DependencyInjection } from '@/types/dependency-injection.js';

export async function setupBot({ services }: DependencyInjection) {
  const { botManagerService, secretsStoreService } = services;

  const botToken = await secretsStoreService.getSecret('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return null;
  }

  const bot = new Bot(botToken).on('message', async (context) => {
    const chatId = context.chatId;
    const userId = context.update?.message?.from?.id ?? -1;
    const chatType = context.update?.message?.chat?.type;
    const shouldInteract = botManagerService.canInteract({ chatId, userId });

    if (!shouldInteract && chatType !== 'group') {
      return;
    }

    if (!shouldInteract && chatType === 'group') {
      await botManagerService.leaveGroup({ bot: context.bot, chatId });
      return;
    }

    await context.reply(`Chat ID: ${chatId}, UserID: ${userId}`);
  });

  return bot;
}
