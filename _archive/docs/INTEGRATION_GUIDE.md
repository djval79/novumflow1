# Integration Guide: Slack & SendGrid

This guide explains how the integration system works in NovumFlow/CareFlow and how to connect Slack and SendGrid.

## Architecture Overview

The integration system uses a secure **Edge Function** (`integration-manager`) to communicate with third-party services. This ensures your API keys are never exposed to the frontend browser.

1.  **Frontend (`IntegrationsPage.tsx`)**:
    *   Displays available integrations.
    *   Sends commands (e.g., "send message", "list logs") to the Edge Function.
2.  **Backend (`supabase/functions/integration-manager`)**:
    *   Receives the command.
    *   Retrieves API keys from Supabase Secrets (Environment Variables).
    *   Calls the third-party API (Slack/SendGrid).
    *   Logs the result to `integration_logs` table.

---

## 1. Connecting Slack

To send notifications to Slack, you need a **Slack Bot Token**.

### Step 1: Create a Slack App
1.  Go to [api.slack.com/apps](https://api.slack.com/apps).
2.  Click **Create New App** > **From scratch**.
3.  Name it "CareFlow Bot" and select your workspace.

### Step 2: Configure Permissions
1.  In the sidebar, go to **OAuth & Permissions**.
2.  Scroll to **Scopes** > **Bot Token Scopes**.
3.  Add the following scopes:
    *   `chat:write` (Required to send messages)
    *   `chat:write.public` (Optional, to post in any public channel)

### Step 3: Install App & Get Token
1.  Scroll up to **OAuth Tokens for Your Workspace**.
2.  Click **Install to Workspace**.
3.  Copy the **Bot User OAuth Token** (starts with `xoxb-...`).

### Step 4: Add Secret to Supabase
Run this command in your terminal (or use the Supabase Dashboard > Edge Functions > Secrets):

```bash
supabase secrets set SLACK_BOT_TOKEN=xoxb-your-token-here
```

### Step 5: Test
1.  Go to the **Integrations** page in the HR Platform.
2.  Click the **Test** button (paper plane icon) on the Slack card.
3.  It should send a message to `#general` (ensure the bot is in the channel or has `chat:write.public`).

---

## 2. Connecting SendGrid (Email)

To send emails (offers, alerts), you need a **SendGrid API Key**.

### Step 1: Get API Key
1.  Log in to [SendGrid](https://sendgrid.com/).
2.  Go to **Settings** > **API Keys**.
3.  Click **Create API Key**.
4.  Give it "Full Access" (or restricted "Mail Send" access).
5.  Copy the API Key (starts with `SG...`).

### Step 2: Verify Sender Identity
1.  Go to **Settings** > **Sender Authentication**.
2.  Verify the email address you want to send *from* (e.g., `hr@ringsteadcare.com`).

### Step 3: Add Secrets to Supabase
Run these commands:

```bash
supabase secrets set SENDGRID_API_KEY=SG.your-api-key
supabase secrets set SENDGRID_FROM_EMAIL=hr@ringsteadcare.com
supabase secrets set SENDGRID_FROM_NAME="Ringstead HR"
```

### Step 4: Test
1.  Go to the **Integrations** page.
2.  Click **Test** on the Email card.
3.  Check your inbox for a test email.

---

## Troubleshooting

### "CORS Error" or "Failed to fetch"
This usually means the Edge Function is not deployed or not accessible.
*   **Fix**: Deploy the function again.
    ```bash
    supabase functions deploy integration-manager
    ```

### "SLACK_BOT_TOKEN not configured"
*   **Fix**: Ensure you added the secret using `supabase secrets set`.

### "channel_not_found" (Slack)
*   **Fix**: Invite the bot to the channel (`/invite @CareFlow Bot`) or use a public channel.
