import type { Bot, Context } from 'gramio';
import type * as constants from '@/constants/index.js';

export class BotManagerService {
  readonly #chatIds: typeof constants.ALLOWED_CHATS_IDS;
  readonly #usersIds: typeof constants.ALLOWED_USERS_IDS;

  constructor({
    chatsIds,
    usersIds,
  }: {
    chatsIds: typeof constants.ALLOWED_CHATS_IDS;
    usersIds: typeof constants.ALLOWED_USERS_IDS;
  }) {
    this.#chatIds = chatsIds;
    this.#usersIds = usersIds;
  }

  canInteract({ chatId, userId }: { chatId: number; userId: number }) {
    return this.#chatIds.includes(chatId) && this.#usersIds.includes(userId);
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
