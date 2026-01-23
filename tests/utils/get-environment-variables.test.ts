import { getEnvironmentVariables } from '@/utils/index.js';

const validEnv = {
  ALLOWED_CHAT_IDS: '[123, 456]',
  ALLOWED_USER_IDS: '[789, 101]',
  GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: 'credentials',
  SPREADSHEET_ID: 'spreadsheet-id',
  SPREADSHEET_BACKLOG_SHEET_NAME: 'backlog',
};

describe('utils: getEnvironmentVariables', () => {
  describe('required environment variables', () => {
    const env = getEnvironmentVariables(validEnv);

    test('ALLOWED_CHAT_IDS', () => {
      expect(env).toHaveProperty('ALLOWED_CHAT_IDS', [123, 456]);
    });

    test('ALLOWED_USER_IDS', () => {
      expect(env).toHaveProperty('ALLOWED_USER_IDS', [789, 101]);
    });

    test('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS', () => {
      expect(env).toHaveProperty(
        'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS',
        'credentials',
      );
    });

    test('SPREADSHEET_ID', () => {
      expect(env).toHaveProperty('SPREADSHEET_ID', 'spreadsheet-id');
    });

    test('SPREADSHEET_BACKLOG_SHEET_NAME', () => {
      expect(env).toHaveProperty('SPREADSHEET_BACKLOG_SHEET_NAME', 'backlog');
    });
  });

  describe('validations', () => {
    describe('ALLOWED_CHAT_IDS', () => {
      test('must be valid JSON array of numbers', () => {
        expect(() =>
          getEnvironmentVariables({ ...validEnv, ALLOWED_CHAT_IDS: 'invalid' }),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    describe('ALLOWED_USER_IDS', () => {
      test('must be valid JSON array of numbers', () => {
        expect(() =>
          getEnvironmentVariables({ ...validEnv, ALLOWED_USER_IDS: 'invalid' }),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    describe('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS', () => {
      test('must be a non-empty string', () => {
        expect(() =>
          getEnvironmentVariables({
            ...validEnv,
            GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: '',
          }),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    describe('SPREADSHEET_ID', () => {
      test('must be a non-empty string', () => {
        expect(() =>
          getEnvironmentVariables({ ...validEnv, SPREADSHEET_ID: '' }),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    describe('SPREADSHEET_BACKLOG_SHEET_NAME', () => {
      test('must be a non-empty string', () => {
        expect(() =>
          getEnvironmentVariables({
            ...validEnv,
            SPREADSHEET_BACKLOG_SHEET_NAME: '',
          }),
        ).toThrowErrorMatchingSnapshot();
      });
    });
  });
});
