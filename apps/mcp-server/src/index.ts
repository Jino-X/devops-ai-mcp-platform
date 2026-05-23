#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools, toolHandlers } from './tools/index.js';
import { logger } from './lib/logger.js';

const server = new Server(
  {
    name: 'devops-ai-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing available tools');
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info(`Executing tool: ${name}`, { args });

  const handler = toolHandlers[name];
  if (!handler) {
    logger.error(`Unknown tool: ${name}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        },
      ],
      isError: true,
    };
  }

  try {
    const startTime = Date.now();
    const result = await handler(args ?? {});
    const duration = Date.now() - startTime;

    logger.info(`Tool ${name} completed`, { duration });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Tool ${name} failed`, { error: errorMessage });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('DevOps AI MCP Server started');
}

main().catch((error) => {
  logger.error('Server failed to start', { error: error.message });
  process.exit(1);
});
