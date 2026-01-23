import type { Bot, Context } from 'gramio';
import { BotManagerService } from '@/services/bot-manager-service.js';

const allowList = {
  chats: [123, 456],
  users: [789, 101],
};

const service = new BotManagerService({ allowList });

describe('BotManagerService', () => {
  describe('canInteract({ chatId, userId })', () => {
    test('returns true when chatId and userId are in the allow list', () => {
      expect(service.canInteract({ chatId: 123, userId: 789 })).toBeTruthy();
    });

    describe('when chatId is not in the allow list', () => {
      test('returns false', () => {
        expect(service.canInteract({ chatId: 999, userId: 789 })).toBeFalsy();
      });
    });

    describe('when userId is not in the allow list', () => {
      test('returns false', () => {
        expect(service.canInteract({ chatId: 123, userId: 999 })).toBeFalsy();
      });
    });

    describe('when both chatId and userId are not in the allow list', () => {
      test('returns false', () => {
        expect(service.canInteract({ chatId: 999, userId: 999 })).toBeFalsy();
      });
    });
  });

  describe('leaveGroup({ bot, chatId })', () => {
    test('calls bot.api.leaveChat with the chatId', async () => {
      const leaveChat = vi.fn().mockResolvedValue(true);
      const bot = { api: { leaveChat } } as unknown as Context<Bot>['bot'];

      await service.leaveGroup({ bot, chatId: 123 });

      expect(leaveChat).toHaveBeenCalledWith({ chat_id: 123 });
    });
  });
});
