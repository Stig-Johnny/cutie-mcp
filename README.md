# cutie-mcp

MCP server for the [Cuti-E](https://cuti-e.com) admin API. Manage conversations, reply to feedback, and monitor the platform from Claude Code or any MCP-compatible client.

## Features

- List and filter conversations (by status, priority, app, category, search)
- View conversation details with full message history
- Send replies and internal notes
- Update conversation status, priority, and assignment
- List apps and view app configuration
- Dashboard analytics (conversation stats, response times, breakdowns, trends)
- Team member listing
- Customer/team info
- Active user stats (DAU/WAU/MAU) per app or across all apps

## Installation

```bash
cd ~/.claude/mcp-servers/cutie-mcp
npm install
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CUTIE_API_KEY` | Yes | Admin API key (`ck_live_...`) |
| `CUTIE_API_URL` | No | API base URL (default: `https://api.cuti-e.com`) |

### Generate an API Key

```bash
# Using session auth (from admin dashboard login)
curl -X POST https://api.cuti-e.com/v1/admin/api-keys \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Claude MCP"}'
```

The response includes the full `api_key` (only shown once). Store it securely.

### MCP Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "cutie-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/post/.claude/mcp-servers/cutie-mcp/index.js"],
      "env": {
        "CUTIE_API_KEY": "ck_live_..."
      }
    }
  }
}
```

## Tools

### Conversations

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_conversations` | `status`, `priority`, `app_id`, `search`, `category`, `assigned_to`, `limit`, `offset`, `sort` | List conversations with optional filters. Returns status, priority, unread counts, and pagination. |
| `get_conversation` | `conversation_id`* | Get a single conversation with full message history and tags. |
| `send_reply` | `conversation_id`*, `message`*, `is_internal_note` | Send a visible reply or internal admin note. |
| `update_conversation` | `conversation_id`*, `status`, `priority`, `assigned_admin_id`, `title`, `category` | Update one or more fields on a conversation. |
| `delete_conversation` | `conversation_id`* | Close/delete a conversation. |

**`list_conversations` filter values:**
- `status`: `open` · `in_progress` · `waiting_user` · `waiting_admin` · `resolved` · `closed`
- `priority`: `low` · `normal` · `high` · `urgent`
- `category`: `bug` · `feature` · `question` · `feedback` · `other`
- `sort`: `last_message` (default) · `created` · `updated`

### Apps

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_apps` | — | List all registered apps with usage stats. |
| `get_app` | `app_id`* | Get app details, configuration, and notification settings. |

### Analytics

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_dashboard` | `period` | Conversation stats, response times, category/status/priority breakdowns, daily trends, and team activity. `period`: `7d` · `30d` (default) · `90d` · `all` |
| `get_active_users` | `app_id`*, `period` | DAU/WAU/MAU for a specific app. `period`: `day` · `week` · `month` (default: all three) |
| `get_active_users_all_apps` | `period` | Active user counts aggregated across all apps. |

### Team & Account

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_team` | — | List all team members with their roles. |
| `get_customer` | — | Get team/customer info including tier, mascot settings, and brand color. |

\* Required parameter

## Security

- API keys are bearer tokens with full admin access to the team's data
- Keys use SHA-256 hashing (never stored in plain text)
- Keys can be revoked instantly via `DELETE /v1/admin/api-keys/:keyId`
- Optional expiry via `expires_in_days` parameter at creation
- Never commit API keys to git -- use environment variables
