import { Bot } from 'gramio';
import type { DependencyInjection } from '@/types/dependency-injection.js';

export async function setupBot({ services }: DependencyInjection) {
  const {
    anthropicService,
    botManagerService,
    googleSheetsService,
    secretsStoreService,
  } = services;

  const botToken = await secretsStoreService.getSecret('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return null;
  }

  const bot = new Bot(botToken).on('message', async (context) => {
    const timeStart = Date.now();
    const message = context.update?.message;

    const chatId = context.chatId;
    const userId = message?.from?.id ?? -1;

    const shouldInteract = botManagerService.canInteract({ chatId, userId });
    const chatType = message?.chat?.type;

    const isGroup = chatType === 'group' || chatType === 'supergroup';

    if (isGroup && !shouldInteract) {
      return await botManagerService.leaveGroup({ bot: context.bot, chatId });
    }

    if (!shouldInteract) {
      return;
    }

    const statusMessage = await context.reply('Processando...');

    try {
      const registeredAt = new Date(context.createdAt * 1000).toISOString();
      const id = message?.message_id;
      const registeredExpense = message?.text;
      if (!id || !registeredExpense) {
        return;
      }

      await statusMessage.editText('Processando via Anthropic...');
      const expense = await anthropicService.parseExpense({
        expense: registeredExpense,
        id,
        registeredAt,
      });

      await statusMessage.editText('Salvando na planilha...');
      const saved = await googleSheetsService.appendExpense(expense);

      if (!saved) {
        return await statusMessage.editText(
          'Erro ao salvar na planilha. Por favor, tente novamente.',
        );
      }

      const timeEnd = Date.now();

      const timeTotal = ((timeEnd - timeStart) / 1000).toPrecision(2);
      await statusMessage.editText(
        `✅ Despesa registrada com sucesso em ${timeTotal}s`,
      );
    } catch (error) {
      console.error('[MESSAGE PROCESSING ERROR] ', error);
      await statusMessage.editText(
        '🔴 Algo inesperado aconteceu. Verifique os logs e tente novamente mais tarde.',
      );
    }
  });

  return bot;
}
