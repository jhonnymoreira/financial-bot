import { setupBot } from '@/bot/setup-bot.js';
import type { DependencyInjection } from '@/types/index.js';

type MessageHandler = (context: unknown) => Promise<void>;

type CommandHandler = (context: unknown) => unknown;

const { mockBot, getHandler, getCommandHandler } = vi.hoisted(() => {
  let handler: MessageHandler | null = null;
  const commandHandlers: Record<string, CommandHandler> = {};
  const mockBot = {
    command: vi.fn((command: string, h: CommandHandler) => {
      commandHandlers[command] = h;
      return mockBot;
    }),
    on: vi.fn((event: string, h: MessageHandler) => {
      if (event === 'message') handler = h;
      return mockBot;
    }),
  };
  return {
    mockBot,
    getHandler: () => {
      if (!handler) throw new Error('Handler not registered');
      return handler;
    },
    getCommandHandler: (command: string) => {
      const h = commandHandlers[command];
      if (!h) throw new Error(`Command handler not registered: ${command}`);
      return h;
    },
  };
});

vi.mock('gramio', () => ({
  Bot: vi.fn(() => mockBot),
}));

function createServices(overrides: {
  botToken?: string | null;
  canInteract?: boolean;
  parseExpense?: Record<string, unknown>;
  registerExpense?: boolean;
}) {
  const editText = vi.fn();
  return {
    services: {
      secretsStoreService: {
        getSecret: vi
          .fn()
          .mockResolvedValue(
            'botToken' in overrides ? overrides.botToken : 'token',
          ),
      },
      botManagerService: {
        canInteract: vi.fn().mockReturnValue(overrides.canInteract ?? true),
        leaveGroup: vi.fn().mockResolvedValue(undefined),
      },
      expenseService: {
        parseExpense: vi.fn().mockResolvedValue(overrides.parseExpense ?? {}),
        registerExpense: vi
          .fn()
          .mockResolvedValue(overrides.registerExpense ?? true),
      },
    } as unknown as DependencyInjection['services'],
    editText,
    createContext: (messageOverrides: {
      chatType?: string;
      text?: string | null;
      messageId?: number | null;
      userId?: number;
    }) => ({
      chatId: 123,
      createdAt: 1706000000,
      bot: {},
      update: {
        message: {
          chat: { type: messageOverrides.chatType ?? 'private' },
          from: { id: messageOverrides.userId ?? 456 },
          message_id:
            'messageId' in messageOverrides ? messageOverrides.messageId : 1,
          text:
            'text' in messageOverrides
              ? messageOverrides.text
              : '100 mercado débito nubank',
        },
      },
      reply: vi.fn().mockResolvedValue({ editText }),
    }),
  };
}

describe('setupBot', () => {
  describe('when bot token is not set', () => {
    test('returns null', async () => {
      const { services } = createServices({ botToken: null });

      const result = await setupBot({ services });

      expect(result).toBeNull();
    });
  });

  describe('when bot token is set', () => {
    test('returns the bot', async () => {
      const { services } = createServices({});

      const result = await setupBot({ services });

      expect(result).toBe(mockBot);
    });
  });

  describe('/start command', () => {
    test('responds with user ID and chat ID', async () => {
      const { services } = createServices({});
      await setupBot({ services });
      const handler = getCommandHandler('start');
      const send = vi.fn();
      const context = { from: { id: 123 }, chatId: 456, send };

      handler(context);

      expect(send).toHaveBeenCalledWith('User ID: 123\nChat ID: 456');
    });
  });

  describe('message handler', () => {
    describe('when user is not allowed in a group', () => {
      test('leaves the group', async () => {
        const { services, createContext } = createServices({
          canInteract: false,
        });
        await setupBot({ services });
        const handler = getHandler();
        const context = createContext({ chatType: 'group' });

        await handler(context);

        expect(services.botManagerService.leaveGroup).toHaveBeenCalled();
      });
    });

    describe('when user is not allowed in private chat', () => {
      test('silently returns', async () => {
        const { services, createContext } = createServices({
          canInteract: false,
        });
        await setupBot({ services });
        const handler = getHandler();
        const context = createContext({ chatType: 'private' });

        await handler(context);

        expect(context.reply).not.toHaveBeenCalled();
      });
    });

    describe('when message has no text', () => {
      test('silently returns after reply', async () => {
        const { services, createContext, editText } = createServices({});
        await setupBot({ services });
        const handler = getHandler();
        const context = createContext({ text: null });

        await handler(context);

        expect(services.expenseService.parseExpense).not.toHaveBeenCalled();
        expect(editText).not.toHaveBeenCalled();
      });
    });

    describe('when expense is registered successfully', () => {
      test('shows success message', async () => {
        const { services, createContext, editText } = createServices({});
        await setupBot({ services });
        const handler = getHandler();
        const context = createContext({});

        await handler(context);

        expect(editText).toHaveBeenLastCalledWith(
          expect.stringContaining('✅ Despesa registrada com sucesso'),
        );
      });
    });

    describe('when expense fails to save', () => {
      test('shows error message', async () => {
        const { services, createContext, editText } = createServices({
          registerExpense: false,
        });
        await setupBot({ services });
        const handler = getHandler();
        const context = createContext({});

        await handler(context);

        expect(editText).toHaveBeenLastCalledWith(
          '🔴 Erro ao salvar na planilha. Por favor, tente novamente.',
        );
      });
    });

    describe('when an error is thrown', () => {
      test('shows generic error message', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { services, createContext, editText } = createServices({});
        services.expenseService.parseExpense = vi
          .fn()
          .mockRejectedValue(new Error('API error'));
        await setupBot({ services });
        const handler = getHandler();
        const context = createContext({});

        await handler(context);

        expect(editText).toHaveBeenLastCalledWith(
          '🔴 Algo inesperado aconteceu. Verifique os logs e tente novamente mais tarde.',
        );
      });
    });
  });
});
