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

| Tool | Description |
|------|-------------|
| `list_conversations` | List conversations with filters (status, priority, app, search, category) |
| `get_conversation` | Get conversation with messages and tags |
| `send_reply` | Send a reply or internal note |
| `update_conversation` | Update status, priority, assignment, title, category |
| `delete_conversation` | Close/delete a conversation |
| `list_apps` | List registered apps with usage stats |
| `get_app` | Get app details and configuration |
| `get_dashboard` | Analytics dashboard (stats, response times, trends) |
| `list_team` | List team members and roles |
| `get_customer` | Get team/customer info |
| `get_active_users` | Get DAU/WAU/MAU for a specific app |
| `get_active_users_all_apps` | Get active user counts across all apps |

## Security

- API keys are bearer tokens with full admin access to the team's data
- Keys use SHA-256 hashing (never stored in plain text)
- Keys can be revoked instantly via `DELETE /v1/admin/api-keys/:keyId`
- Optional expiry via `expires_in_days` parameter at creation
- Never commit API keys to git -- use environment variables
