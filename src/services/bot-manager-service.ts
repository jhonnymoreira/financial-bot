import type { Bot, Context } from 'gramio';
import type { AllowList } from '@/types/index.js';

export class BotManagerService {
  readonly #allowList: AllowList;

  constructor({ allowList }: { allowList: AllowList }) {
    this.#allowList = allowList;
  }

  canInteract({ chatId, userId }: { chatId: number; userId: number }) {
    const allowList = this.#allowList;

    return allowList.chats.includes(chatId) && allowList.users.includes(userId);
  }

  async leaveGroup({
    bot,
    chatId,
  }: {
    bot: Context<Bot>['bot'];
    chatId: number;
  }) {
    return await bot.api.leaveChat({ chat_id: chatId });
  }
}
