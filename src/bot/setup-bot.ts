import { Bot } from 'gramio';
import { z } from 'zod';
import type { DependencyInjection } from '@/types/dependency-injection.js';
import { expenseSchema } from '@/types/expense.js';

export async function setupBot({ services }: DependencyInjection) {
  const {
    botManagerService,
    geminiService,
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

      await statusMessage.editText('Processando via Gemini...');
      const parsedExpense = await geminiService.parseRegisterExpense({
        expense: registeredExpense,
        id,
        registeredAt,
      });

      const expense = expenseSchema.safeParse(parsedExpense);
      if (!expense.success) {
        console.log(JSON.stringify(z.treeifyError(expense.error), null, 2));
        return await statusMessage.editText(
          'O Gemini não conseguiu processar a mensagem corretamente.',
        );
      }

      await statusMessage.editText('Salvando na planilha...');
      const saved = await googleSheetsService.appendExpense(expense.data);

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
      console.log('[MESSAGE PROCESSING ERROR] ', error);
      await statusMessage.editText(
        '🔴 Algo inesperado aconteceu. Verifique os logs e tente novamente mais tarde.',
      );
    }
  });

  return bot;
}
