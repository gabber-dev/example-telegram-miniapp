This is a Telegram mini app example built on Gabber's [React SDK](https://github.com/gabber-dev/sdks-ts).

pnpm install gabber-client-react
pnpm install gabber-client-core

To connect to Gabber, grab your API key from your [Gabber Dashboard](https://app.gabber.dev) and add as an environment variable called GABBER_API_KEY.

This app will pull all of your personas and scenarios from your Gabber dashboard, allowing you to have simulated realtime voice chats from within a telegram mini app window. It will also let you generate voice snippets which can be sent to specific Telegram channels and chats that your Bot has access to (bots need admin access to channels, and chats you'll need to DM the bot first to enable sending of messages to the chat via API.

To set up telegram, follow [this tutorial](https://help.zoho.com/portal/en/kb/desk/support-channels/instant-messaging/telegram/articles/telegram-integration-with-zoho-desk#How_to_create_a_Telegram_Bot) to obtain a BOT_TOKEN.

Create a BOT_TOKEN environment variable for use in API calls to telegram.

When adding a channel username, use the https://api.telegram.org/bot{token}/getUpdates endpoint. In the sample app sending voice notes, channels/chats should be sent with their numerical ID (channels e.g. -############# and DMs should be ###########).
