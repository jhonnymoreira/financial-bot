# Financial Bot

A Telegram bot integration to tidy up your finances.

Parses natural language expense messages using Claude AI and automatically registers them into a Google Sheets spreadsheet.

**Note**: Bot status messages are currently in pt-BR. Support for other locales is planned.

## Table of Contents

- [Installation](#installation)
- [Prerequisites](#prerequisites)
  - [Anthropic API Key](#anthropic-api-key)
  - [Google Sheets Setup](#google-sheets-setup)
  - [Cloudflare Setup](#cloudflare-setup)
    - [Configure wrangler.jsonc](#configure-wranglerjsonc)
    - [Secrets Store](#secrets-store)
    - [Wrangler Secrets](#wrangler-secrets)
    - [Deploy](#deploy)
  - [Telegram Setup](#telegram-setup)
    - [Creating the Bot](#creating-the-bot)
    - [Registering the Webhook](#registering-the-webhook)
    - [Getting User and Chat IDs](#getting-user-and-chat-ids)
- [Usage](#usage)
  - [Examples](#examples)
  - [Payment Methods](#payment-methods)
  - [Temporal References](#temporal-references)
  - [Categories](#categories)
- [Monitoring](#monitoring)
- [Local Development](#local-development)
  - [Setup](#setup)
- [Available Scripts](#available-scripts)
- [TODO](#todo)

## Installation

1. Clone the repository:

```bash
git clone git@github.com:jhonnymoreira/financial-bot.git
cd financial-bot
```

2. Enable corepack and install dependencies:

```bash
corepack enable
pnpm install
```

3. Authenticate with Cloudflare:

```bash
pnpm exec wrangler login
```

## Prerequisites

- [Node.js](https://nodejs.org/) v24.13.0 (use [nvm](https://github.com/nvm-sh/nvm) with the `.nvmrc` file)
- [pnpm](https://pnpm.io/) v10.28.1 via [corepack](https://nodejs.org/api/corepack.html)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Anthropic account](https://platform.claude.com/)
- [Google account](https://accounts.google.com/)
- [Telegram account](https://telegram.org/)

### Anthropic API Key

1. Go to [Claude Platform](https://platform.claude.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key** and give it a name
5. Copy the key — you'll need it for the [Secrets Store](#secrets-store)

### Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**
4. Go to **IAM & Admin** > **Service Accounts** and create a new service account
5. Create a JSON key for the service account and save it — this is your `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
6. Create a Google Sheet with the following columns (in order):

| occurredAt | amount | description | category | paymentMethod | paymentIdentifier | currency | messageId | registeredAt |
|------------|--------|-------------|----------|---------------|-------------------|----------|-----------|--------------|

7. Share the spreadsheet with the service account email (found in the JSON key as `client_email`) with **Editor** permissions
8. Copy the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

### Cloudflare Setup

#### Configure wrangler.jsonc

Update the `name` field in `wrangler.jsonc` to your project identifier:

```jsonc
{
  "name": "<your-project-name>",
  // ...
}
```

This name is used as a prefix for your secrets in the secrets store.

#### Secrets Store

Create a secrets store:

```bash
pnpm exec wrangler secrets-store create <your-project-name>-secrets --remote
```

Save the returned store ID. Add secrets to the store:

```bash
pnpm exec wrangler secrets-store secret put <store-id> <your-project-name>_anthropic_api_key --remote
pnpm exec wrangler secrets-store secret put <store-id> <your-project-name>_telegram_bot_token --remote
pnpm exec wrangler secrets-store secret put <store-id> <your-project-name>_telegram_webhook_secret_token --remote
```

To generate a webhook secret token:

```bash
openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
```

Save this value — you'll need it for both the secrets store and Telegram webhook registration.

Update `wrangler.jsonc` with your store ID and secret names:

```jsonc
{
  "secrets_store_secrets": [
    {
      "binding": "ANTHROPIC_API_KEY",
      "store_id": "<your-store-id>",
      "secret_name": "<your-project-name>_anthropic_api_key"
    },
    {
      "binding": "TELEGRAM_BOT_TOKEN",
      "store_id": "<your-store-id>",
      "secret_name": "<your-project-name>_telegram_bot_token"
    },
    {
      "binding": "TELEGRAM_WEBHOOK_SECRET_TOKEN",
      "store_id": "<your-store-id>",
      "secret_name": "<your-project-name>_telegram_webhook_secret_token"
    }
  ]
}
```

#### Wrangler Secrets

Set the remaining secrets via `wrangler secret put`:

```bash
pnpm exec wrangler secret put ALLOWED_USER_IDS
# Enter: [<user-id-1>, <user-id-2>]

pnpm exec wrangler secret put ALLOWED_CHAT_IDS
# Enter: [<chat-id-1>, <chat-id-2>]

pnpm exec wrangler secret put GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
# Enter: <service-account-json>

pnpm exec wrangler secret put SPREADSHEET_ID
# Enter: <spreadsheet-id>

pnpm exec wrangler secret put SPREADSHEET_BACKLOG_SHEET_NAME
# Enter: <sheet-name>
```

#### Deploy

1. Generate Cloudflare bindings types:

```bash
pnpm cf:typegen
```

2. Deploy:

```bash
pnpm cf:deploy
```

Note the worker URL from the output (e.g., `https://<your-project-name>.<account>.workers.dev`).

### Telegram Setup

#### Creating the Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts to name your bot
3. Save the bot token — add it to `<your-project-name>_telegram_bot_token` (see [Secrets Store](#secrets-store) section for reference)
4. Send `/setprivacy`, select your bot, then choose `Disable` to allow the bot to read group messages

#### Registering the Webhook

After deploying, register the webhook with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-worker-url>/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET_TOKEN>"
  }'
```

#### Getting User and Chat IDs

Send `/start` to your bot — it will respond with your user ID and chat ID.

For group chats, add the bot to the group and send `/start` there to get the group's chat ID (groups have negative IDs).

## Usage

Add the bot to a group or send a direct message, then send expense messages following this format:

**Note**: The bot currently supports single messages only. Multi-message support is planned for the future.

```
{amount} {description} {temporal_ref} {payment_method} {payment_identifier} [categories]
```

### Examples

```
99 Pizzaria maneira hoje débito identificador-do-banco
32.50 Besteirinhas no mercado 21/12/2025 pix identificador-do-banco
150 Cinema com a família ontem crédito identificador-do-banco entertainment,food
```

### Payment Methods

`débito` (debit), `crédito` (credit), `pix`, `boleto`

### Temporal References

The bot understands temporal references in pt-BR and calculates the `occurredAt` date accordingly. These references are stripped from the final description:

`hoje`, `ontem`, `anteontem`, `[N] dia(s) atrás`, `semana passada`, `mês passado`, `ano passado`, `segunda`, `terça`, `quarta`, `quinta`, `sexta`, `sábado`, `domingo`

You can also use explicit dates like `21/12/2025`.

### Categories

You can pass one or more categories as the last argument, separated by comma. If not provided, the bot infers from the description.

`appliances`, `candomble`, `car`, `credit-allowance`, `education`, `entertainment`, `food`, `gifts`, `health`, `market`, `monthly-expenses`, `pets`, `self-care`, `subscriptions`, `subscriptions-1-month`, `subscriptions-3-months`, `subscriptions-6-months`, `subscriptions-1-year`, `taxes`, `transport`, `work`

## Monitoring

Monitor real-time logs from your deployed worker:

```bash
pnpm exec wrangler tail
```

## Local Development

This project is webhook-based and designed to run on Cloudflare Workers. Local development requires tunneling your connection (e.g., [ngrok](https://ngrok.com/), [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)).

**Note**: If the tunnel URL changes, you must re-register the webhook with Telegram.

### Setup

Create a `.dev.vars` file with all required variables:

```bash
ALLOWED_USER_IDS="[<user-id-1>, <user-id-2>]"
ALLOWED_CHAT_IDS="[<chat-id-1>, <chat-id-2>]"
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS=<service-account-json>
SPREADSHEET_ID="<spreadsheet-id>"
SPREADSHEET_BACKLOG_SHEET_NAME="<sheet-name>"
ANTHROPIC_API_KEY=<your-anthropic-api-key>
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
TELEGRAM_WEBHOOK_SECRET_TOKEN=<your-webhook-secret-token>
```

Start the development server:

```bash
pnpm cf:dev
```

Tunnel your connection and register the webhook with the tunnel URL.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm cf:dev` | Start local development server |
| `pnpm cf:deploy` | Deploy to Cloudflare Workers (minified) |
| `pnpm cf:typegen` | Generate TypeScript types for Cloudflare bindings |
| `pnpm code:lint` | Run Biome linter |
| `pnpm code:lint:fix` | Run Biome linter with auto-fix |
| `pnpm code:prettify` | Format code with Biome |
| `pnpm code:typecheck` | Run TypeScript type checking |
| `pnpm test` | Run test suite |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:watch` | Run tests in watch mode |

## TODO

- [ ] Add changesets
- [ ] Add commit hooks to integrate `pnpm code:lint`, `pnpm code:typecheck`, and `pnpm test`
- [ ] Add GitHub Actions integration
