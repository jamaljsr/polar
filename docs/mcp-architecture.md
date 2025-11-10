# MCP Architecture

## Overview

Polar's MCP (Model Context Protocol) server enables AI agents to programmatically control Lightning Network simulations through a standardized tool-based API. This integration allows LLMs like Claude & Cursor to create networks, open channels, send payments, and more.

## Architecture Layers

```

┌─────────────────────────────────────────┐
│ MCP Server (@lightningpolar/mcp)        │
│ - Stdio transport for LLM integration   │
│ - Tool discovery and execution          │
└──────────────┬──────────────────────────┘
               │ HTTP (localhost:37373)
┌──────────────▼──────────────────────────┐
│ HTTP Bridge (electron/mcpBridge.ts)     │
│ - GET /health                           │
│ - GET /api/mcp/tools                    │
│ - POST /api/mcp/execute                 │
└──────────────┬──────────────────────────┘
               │ IPC (Electron)
┌──────────────▼──────────────────────────┐
│ IPC Layer (src/store/models/mcp/ipc)    │
│ - Tool definitions handler              │
│ - Tool execution dispatcher             │
└──────────────┬──────────────────────────┘
               │ Redux Actions
┌──────────────▼──────────────────────────┐
│ Tool Implementations (48 tools)         │
│ - Network (18): CRUD, nodes, config     │
│ - Bitcoin (6): mining, wallet           │
│ - Lightning (10): channels, payments    │
│ - Taproot Assets (9): mint, transfer    │
│ - Terminal (3): session management      │
└─────────────────────────────────────────┘

```

## Component Breakdown

### 1. MCP Server ([@lightningpolar/mcp](https://github.com/jamaljsr/polar-mcp))

- **Purpose**: Implements MCP specification for LLM integration
- **Transport**: Stdio (compatible with Claude Desktop, Cursor, etc.)
- **Communication**: HTTP requests to Polar's bridge
- **Features**: Tool caching, retry logic, error handling

### 2. HTTP Bridge (`electron/mcpBridge.ts`)

- **Purpose**: HTTP server for external MCP access
- **Port**: 37373 (localhost only)
- **Security**: CORS restrictions, request size limits, timeouts
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /api/mcp/tools` - List available tools (5s timeout)
  - `POST /api/mcp/execute` - Execute tool (30s timeout)

### 3. IPC Layer (`src/store/models/mcp/ipc.ts`)

- **Purpose**: Bridge main process and renderer process
- **Channels**: `mcp-tool-definitions`, `mcp-execute-tool`
- **Features**: Response channels with timestamps, timeout handling

### 4. Tool Implementations (`src/store/models/mcp/`)

- **Pattern**: Each tool has definition + implementation + tests
- **Structure**: `/network/`, `/bitcoin/`, `/lightning/`, `/tap/`, `/lit/`
- **Features**: Consistent validation, error handling, status serialization

## Adding New Tools

1. **Create tool definition** in `src/store/models/mcp/{category}/{toolName}.ts`:

   ```typescript
   export const myToolDefinition: McpToolDefinition = {
     name: 'my_tool',
     description: 'Clear description for LLM',
     inputSchema: {
       type: 'object',
       properties: {
         param1: {
           type: 'string',
           description: 'Description of parameter',
         },
       },
       required: ['param1'],
     },
   };
   ```

2. **Add implementation** using thunk:

   ```typescript
   export const myToolTool = thunk<McpModel>(async (actions, args, helpers) => {
     validateRequired(args, 'param1');
     // Implementation logic here
     return result;
   });
   ```

3. **Create tests** in `{toolName}.spec.ts`:

   - Test success scenario
   - Test validation errors
   - Test edge cases

4. **Export** from `src/store/models/mcp/index.ts`:

   ```typescript
   export { myToolDefinition, myToolTool } from './{category}/myTool';
   ```

5. **Add to IPC handler** in `src/store/models/mcp/ipc.ts`:

   ```typescript
   case myToolDefinition.name:
     result = await mcpActions.myTool(args);
     break;
   ```

## Security Considerations

- **Localhost-only binding**: Server only accepts connections from localhost
- **CORS restrictions**: Validates origin matches localhost pattern
- **Request size limits**: 1MB maximum payload
- **Timeout protections**: 5s for tool definitions, 30s for execution
- **No authentication**: Not needed since localhost-only

## Testing Strategy

- **94 test files** covering all 48 tools
- **Mock infrastructure**: `createMockRootModel()` helper
- **Coverage**: Success cases, error cases, edge cases
- **Pattern**: Consistent test structure across all tools

## Tool Categories

### Network Tools (18)

Manage Polar networks and nodes: create, start, stop, delete, import, export, rename, add/remove nodes

### Bitcoin Tools (6)

Control blockchain: mine blocks, auto-mine, wallet operations, blockchain info

### Lightning Tools (10)

Lightning operations: channels, payments, invoices, balances, node info

### Taproot Assets Tools (9)

Asset operations: mint, transfer, addresses, universe sync, asset channels

### LitD Tools (3)

Lightning Terminal: session management

## Configuration

- **Port**: Default 37373, configurable via `POLAR_MCP_PORT` env var
- **Timeouts**: Tool definitions (5s), tool execution (30s)
- **Max request size**: 1MB
