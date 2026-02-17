#!/usr/bin/env node

/**
 * Cuti-E MCP Server
 *
 * Manage conversations, reply to feedback, and monitor the Cuti-E platform
 * via admin API keys (ck_live_ bearer tokens).
 *
 * Required environment variables:
 * - CUTIE_API_KEY: Admin API key (ck_live_...)
 * - CUTIE_API_URL: Base URL (default: https://api.cuti-e.com)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const apiKey = process.env.CUTIE_API_KEY;
const apiUrl = (process.env.CUTIE_API_URL || "https://api.cuti-e.com").replace(/\/$/, "");

if (!apiKey) {
  console.error("CUTIE_API_KEY environment variable is required");
  process.exit(1);
}

/**
 * Make an authenticated request to the Cuti-E API
 */
async function apiRequest(method, path, { query, body } = {}) {
  let url = `${apiUrl}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };

  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  return data;
}

// Create MCP server
const server = new Server(
  { name: "cutie-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_conversations",
      description:
        "List conversations with optional filters. Returns conversations with status, priority, unread counts, and pagination.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter by status: open, in_progress, waiting_user, waiting_admin, resolved, closed",
          },
          priority: {
            type: "string",
            description: "Filter by priority: low, normal, high, urgent",
          },
          app_id: {
            type: "string",
            description: "Filter by app ID",
          },
          search: {
            type: "string",
            description: "Search in conversation titles and messages",
          },
          category: {
            type: "string",
            description: "Filter by category: bug, feature, question, feedback, other",
          },
          assigned_to: {
            type: "string",
            description: "Filter by assigned admin ID",
          },
          limit: {
            type: "number",
            description: "Max results (default: 50)",
          },
          offset: {
            type: "number",
            description: "Pagination offset (default: 0)",
          },
          sort: {
            type: "string",
            description: "Sort by: last_message, created, updated (default: last_message)",
          },
        },
      },
    },
    {
      name: "get_conversation",
      description:
        "Get a single conversation with its messages and tags.",
      inputSchema: {
        type: "object",
        properties: {
          conversation_id: {
            type: "string",
            description: "The conversation ID (conv_...)",
          },
        },
        required: ["conversation_id"],
      },
    },
    {
      name: "send_reply",
      description:
        "Send a reply message in a conversation. Can be a visible reply or an internal note.",
      inputSchema: {
        type: "object",
        properties: {
          conversation_id: {
            type: "string",
            description: "The conversation ID to reply to",
          },
          message: {
            type: "string",
            description: "The message text",
          },
          is_internal_note: {
            type: "boolean",
            description: "If true, message is only visible to admins (default: false)",
          },
        },
        required: ["conversation_id", "message"],
      },
    },
    {
      name: "update_conversation",
      description:
        "Update conversation status, priority, assignment, title, or category.",
      inputSchema: {
        type: "object",
        properties: {
          conversation_id: {
            type: "string",
            description: "The conversation ID to update",
          },
          status: {
            type: "string",
            description: "New status: open, in_progress, waiting_user, waiting_admin, resolved, closed",
          },
          priority: {
            type: "string",
            description: "New priority: low, normal, high, urgent",
          },
          assigned_admin_id: {
            type: "string",
            description: "Admin ID to assign, or null to unassign",
          },
          title: {
            type: "string",
            description: "New conversation title",
          },
          category: {
            type: "string",
            description: "New category: bug, feature, question, feedback, other",
          },
        },
        required: ["conversation_id"],
      },
    },
    {
      name: "delete_conversation",
      description:
        "Close/delete a conversation.",
      inputSchema: {
        type: "object",
        properties: {
          conversation_id: {
            type: "string",
            description: "The conversation ID to delete",
          },
        },
        required: ["conversation_id"],
      },
    },
    {
      name: "list_apps",
      description:
        "List all registered apps for the current team, with usage stats.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_app",
      description:
        "Get details for a specific app including configuration and notification settings.",
      inputSchema: {
        type: "object",
        properties: {
          app_id: {
            type: "string",
            description: "The app ID (app_...)",
          },
        },
        required: ["app_id"],
      },
    },
    {
      name: "get_dashboard",
      description:
        "Get analytics dashboard with conversation stats, response times, breakdowns by category/status/priority/app, daily trends, and team activity.",
      inputSchema: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period: 7d, 30d, 90d, all (default: 30d)",
          },
        },
      },
    },
    {
      name: "list_team",
      description:
        "List all team members with their roles.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_customer",
      description:
        "Get current team/customer info including tier, mascot settings, and brand color.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "list_conversations": {
        const query = {};
        if (args?.status) query.status = args.status;
        if (args?.priority) query.priority = args.priority;
        if (args?.app_id) query.app_id = args.app_id;
        if (args?.search) query.search = args.search;
        if (args?.category) query.category = args.category;
        if (args?.assigned_to) query.assigned_to = args.assigned_to;
        if (args?.limit) query.limit = args.limit;
        if (args?.offset) query.offset = args.offset;
        if (args?.sort) query.sort = args.sort;
        result = await apiRequest("GET", "/v1/conversations", { query });
        break;
      }

      case "get_conversation": {
        result = await apiRequest("GET", `/v1/conversations/${args.conversation_id}`);
        break;
      }

      case "send_reply": {
        const body = { message: args.message };
        if (args.is_internal_note) body.is_internal_note = true;
        result = await apiRequest("POST", `/v1/conversations/${args.conversation_id}/messages`, { body });
        break;
      }

      case "update_conversation": {
        const body = {};
        if (args.status !== undefined) body.status = args.status;
        if (args.priority !== undefined) body.priority = args.priority;
        if (args.assigned_admin_id !== undefined) body.assigned_admin_id = args.assigned_admin_id;
        if (args.title !== undefined) body.title = args.title;
        if (args.category !== undefined) body.category = args.category;
        result = await apiRequest("PATCH", `/v1/conversations/${args.conversation_id}`, { body });
        break;
      }

      case "delete_conversation": {
        result = await apiRequest("DELETE", `/v1/conversations/${args.conversation_id}`);
        break;
      }

      case "list_apps": {
        result = await apiRequest("GET", "/v1/apps");
        break;
      }

      case "get_app": {
        result = await apiRequest("GET", `/v1/apps/${args.app_id}`);
        break;
      }

      case "get_dashboard": {
        const query = {};
        if (args?.period) query.period = args.period;
        result = await apiRequest("GET", "/v1/analytics/dashboard", { query });
        break;
      }

      case "list_team": {
        result = await apiRequest("GET", "/v1/team");
        break;
      }

      case "get_customer": {
        result = await apiRequest("GET", "/v1/customer");
        break;
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Cuti-E API error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cuti-E MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
