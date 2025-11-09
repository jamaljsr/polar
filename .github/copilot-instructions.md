# Polar - AI Coding Assistant Instructions

Polar is a Bitcoin Lightning Network development tool that creates local regtest networks using Docker containers. This guide helps AI agents understand the architecture and contribute effectively.

## Core Architecture

### Network Orchestration via Docker Compose
- Networks are composed of Bitcoin nodes (bitcoind) and Lightning nodes (LND, Core Lightning, Eclair)
- Each network generates a `docker-compose.yml` file with pre-configured containers
- Node configurations are templated in `src/lib/docker/composeFile.ts` with variable substitution
- Lightning nodes auto-select compatible Bitcoin backends via `filterCompatibleBackends()`

### State Management (Easy-Peasy + Redux)
- **Store Structure**: `src/store/models/` - modular stores for network, lightning, bitcoin, designer, mcp
- **Network Model**: Manages network lifecycle, node creation, Docker orchestration
- **Designer Model**: Handles visual chart state, drag-drop interactions, node positioning
- **Key Pattern**: Actions update state → triggers React re-renders → auto-saves via debounced effects

### Visual Designer (React Flow Chart)
- Network topology represented as interactive graph in `src/components/designer/NetworkDesigner.tsx`
- Drag-drop from sidebar adds nodes via `onCanvasDrop` → creates loading node → async node creation → replaces with real node
- Chart state syncs with network model; positions persisted to disk
- Custom components: `NodeInner`, `Link`, `Port` for Bitcoin/Lightning-specific rendering

## Development Patterns

### Node Creation Workflow
1. User drags node type from sidebar → `onCanvasDrop` triggered
2. Temporary loading node added to chart
3. `network.addNode()` creates node in network model
4. Docker compose file regenerated via `dockerService.saveComposeFile()`
5. If network running, node auto-starts via `toggleNode()`
6. Loading node replaced with actual node in chart

### Testing Strategy
- **Unit Tests**: Jest with React Testing Library, emphasis on Redux action/state testing
- **Mocks**: Extensive Docker service mocking in `src/__mocks__/`
- **Test Utilities**: `src/utils/tests/` provides network factories, state builders, async helpers

### Lightning Integration
- **API Clients**: Generated from protobuf definitions in `@lightningpolar/*-api` packages
- **Service Layer**: `src/lib/lightning/` abstracts node implementations (LND, CLN, Eclair)
- **State Sync**: Background polling updates node state, channel info, balances
- **Version Compatibility**: Managed via compatibility matrices in `src/utils/constants.ts`

## MCP Server Integration

### Architecture
- **Bridge**: Electron main process runs HTTP server on port 37373 (`electron/mcpBridge.ts`)
- **IPC Communication**: Main ↔ Renderer via `ipcChannels.mcpExecuteTool`/`mcpToolDefinitions`
- **Tool Definitions**: Redux store exposes available tools dynamically (`src/store/models/mcp/`)
- **External Package**: Standalone MCP server in `mcp-server/` communicates with bridge

### Tool Implementation Pattern
```typescript
// Tool definition (schema + description)
export const toolDefinition: McpToolDefinition = {
  name: 'tool_name',
  description: 'Clear description for LLM',
  inputSchema: { /* JSON schema */ }
};

// Tool implementation (easy-peasy thunk)
export const toolAction = thunk<Args, Result>(async (actions, args, { getStoreState, getStoreActions }) => {
  // 1. Validate args
  // 2. Access network/node state
  // 3. Execute operations
  // 4. Return structured result
});
```

## Key Commands & Workflows

### Development Commands
- `yarn dev` - Hot-reload development (React + Electron)
- `yarn test` - Jest unit tests with watch mode
- `yarn test:ci` - Jest unit tests in run mode with coverage displayed
- `yarn test:e2e` - Full TestCafe integration tests
- `yarn lint:all` - TypeScript + ESLint validation
- `yarn ci` - TypeScript + ESLint + Jest for CI
- `yarn theme` - Compile LESS themes to CSS

### Network Management
- Networks stored as JSON in `~/.polar/networks/`
- Docker containers use `polar-n{id}-{nodeName}` naming convention  
- Ports auto-assigned from base ports + node index
- Custom node images supported via `managedImages`/`customImages` config

### File Structure Conventions
- `src/components/` - React UI components, grouped by feature
- `src/store/models/` - Easy-peasy store modules
- `src/lib/` - Service layer (docker, lightning, bitcoin APIs)
- `src/utils/` - Pure functions, constants, test helpers
- `electron/` - Main process code (window management, IPC, MCP bridge)

## Contributing Guidelines
- **Commits**: Follow Conventional Commits (`feat:`, `fix:`, `docs:`)
- **PRs**: Include tests, ensure `yarn ci` passes
- **Architecture**: Maintain separation between UI components, store models, and service layers
- **Testing**: Add unit tests for store actions, component tests for UI interactions