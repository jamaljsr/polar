# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About Polar

Polar is a desktop application for creating local Bitcoin Lightning Network simulations for development and testing. It orchestrates Bitcoin (bitcoind) and Lightning nodes (LND, Core Lightning, Eclair) using Docker containers, providing a visual interface for network management, channel operations, and payment testing.

## Essential Commands

### Development

```bash
yarn                # Install dependencies
yarn dev            # Run with hot-reload (React + Electron restart)
yarn test           # Run unit tests in watch mode
yarn test:ci        # Run unit tests with coverage
yarn test:e2e       # Run end-to-end tests (builds first)
yarn lint:all       # Run TypeScript + ESLint checks
yarn ci             # Full CI check (lint + test:ci)
```

### Testing Individual Files

```bash
# Run a single test file
yarn test path/to/file.spec.ts

# Run tests matching a pattern
yarn test --testPathPattern=network

# Run specific test by name
yarn test -t "test name"
```

### Building

```bash
yarn build          # Build React app
yarn package        # Build + package desktop app for current OS
```

## Architecture Overview

### Dual-Process Electron Architecture

**Main Process (`/electron`):**

- Entry point: `electron/index.ts` (compiles to `public/main/electron/index.js`)
- Window lifecycle and IPC orchestration via `windowManager.ts`
- gRPC proxy servers for Lightning nodes (LND, CLN, Eclair) and Taproot Assets
- HTTP bridge for MCP server integration (`mcpBridge.ts` on port 37373)

**Renderer Process (`/src`):**

- Entry point: `src/index.tsx`
- React app with Redux state management via Easy-Peasy
- Cannot directly access filesystem or make gRPC calls (uses IPC to main process)

### Why Proxy Pattern for Node Communication?

The renderer process cannot access Docker volumes or make gRPC calls. The main process:

1. Reads TLS certs and macaroons from Docker volumes
2. Creates and caches gRPC clients
3. Proxies requests from renderer via IPC
4. Streams real-time events (channels, invoices) back to UI

**IPC Flow:**

```
UI Component → Store Action → Service → IPC Sender →
Main Process Proxy → gRPC Client → Lightning Node Container
```

### State Management (Easy-Peasy)

Store structure in `src/store/models/`:

- `app` - Application-wide state, settings, initialization
- `network` - Network CRUD, lifecycle (start/stop/delete)
- `bitcoin` - Bitcoin node operations (mining, wallet)
- `lightning` - Lightning operations (channels, payments, invoices)
- `tap` - Taproot Assets operations (mint, send, receive)
- `designer` - Visual network chart state (positions, links)
- `mcp` - MCP tool definitions and execution

**Easy-Peasy Patterns:**

- **Actions**: Synchronous state mutations using Immer
- **Thunks**: Async operations with injected dependencies (services)
- **Computed**: Derived state (memoized selectors)
- **Injections**: `dockerService`, `lightningFactory`, `bitcoinFactory`, `tapFactory`, etc.

### Service Layer (Multi-Implementation Support)

**Factory Pattern** (`src/lib/lightning/`, `src/lib/bitcoin/`):

```
LightningFactory.getService(node) →
  LND → lndService
  CLN → clightningService
  Eclair → eclairService
```

Services normalize implementation-specific types to common interfaces (`LightningNodeInfo`, `LightningNodeBalances`, etc.)

### Docker Integration

**`src/lib/docker/dockerService.ts`** orchestrates all container operations:

- Generates `docker-compose.yml` from network configuration
- Manages container lifecycle (start/stop/restart)
- Handles volume permissions (critical on Linux - USERID/GROUPID injection)
- Network persistence (save/load to `~/.polar/networks/`)

**Compose File Generation** (`src/lib/docker/composeFile.ts`):

- Template-based: `addBitcoind()`, `addLnd()`, `addClightning()`, `addEclair()`, `addTapd()`
- Auto-configures dependencies (Lightning nodes → Bitcoin backends)
- Port auto-assignment from base ports + node index

### Visual Designer

**React Flow Chart** (`src/components/designer/NetworkDesigner.tsx`):

- Interactive graph using `@mrblenny/react-flow-chart`
- Drag-drop from sidebar → creates loading node → async creation → replaces with real node
- Chart state syncs with network model
- Custom components: `NodeInner`, `Link`, `Port` for node-specific rendering

**Key Pattern:**

```
User drags node → onCanvasDrop → create loading node in chart →
network.addNode() thunk → Docker compose update →
if network running: start container → replace loading node with real node
```

### MCP Integration (feat/mcp-server branch)

Exposes Polar functionality to AI agents via Model Context Protocol:

**Architecture Layers:**

```
MCP Server (@lightningpolar/mcp) - Stdio transport
        ↓ HTTP (localhost:37373)
HTTP Bridge (electron/mcpBridge.ts)
        ↓ IPC
Tool Dispatcher (src/store/models/mcp/ipc.ts)
        ↓ Redux Actions
48 Tool Implementations (network, bitcoin, lightning, tap, litd)
```

**Adding New MCP Tools:**

1. Create definition in `src/store/models/mcp/{category}/{toolName}.ts`
2. Implement as Easy-Peasy thunk with validation
3. Add tests in `{toolName}.spec.ts`
4. Export from `src/store/models/mcp/index.ts`
5. Wire in IPC handler at `src/store/models/mcp/ipc.ts`

See `docs/mcp-architecture.md` for detailed guide.

## Key File Locations

### State & Logic

- `src/store/models/network.ts` - Network lifecycle (create/start/stop/delete)
- `src/store/models/lightning.ts` - Lightning operations
- `src/store/models/bitcoin.ts` - Bitcoin operations
- `src/store/models/designer.ts` - Visual designer state
- `src/store/index.ts` - Root store with dependency injection

### Services

- `src/lib/docker/dockerService.ts` - Docker orchestration
- `src/lib/lightning/lndService.ts` - LND API wrapper
- `src/lib/lightning/clightningService.ts` - Core Lightning wrapper
- `src/lib/lightning/eclairService.ts` - Eclair wrapper
- `src/lib/tapd/tapdService.ts` - Taproot Assets wrapper

### Electron Main Process

- `electron/windowManager.ts` - Window lifecycle, IPC proxies
- `electron/lnd/lndProxyServer.ts` - LND gRPC proxy
- `electron/tapd/tapdProxyServer.ts` - Tapd gRPC proxy
- `electron/mcpBridge.ts` - HTTP server for MCP integration

### Utilities

- `src/utils/network.ts` - Network creation helpers
- `src/utils/constants.ts` - Version compatibility matrices
- `src/utils/tests/` - Test helpers and mocks

## Testing Patterns

### Unit Tests (Jest)

- Co-located: `*.spec.ts` next to implementation
- Mock infrastructure via `src/utils/tests/helpers.ts`
- Pattern: Mock injections when creating store

```typescript
const store = createReduxStore({
  injections: {
    dockerService: mockDockerService,
    lightningFactory: mockLightningFactory,
    // ...
  },
});
```

### E2E Tests (TestCafe)

- Located in `/e2e/*.e2e.ts`
- Page Object Pattern in `/e2e/pages/`
- Runs against built app in production mode
- Tests high-level user flows (network creation, import/export)

## Development Conventions

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

Use `yarn cm` for guided commit message creation.

### Code Organization

- **React Components**: Feature-grouped in `src/components/`
- **Store Models**: Modular in `src/store/models/`
- **Services**: Implementation-agnostic in `src/lib/`
- **Utilities**: Pure functions in `src/utils/`
- **Types**: Shared types in `src/shared/` (used by both main and renderer)

### Dependency Injection

Services are injected into the Easy-Peasy store, not imported directly in thunks:

```typescript
// Good - uses injected service
const myThunk = thunk(async (actions, payload, { injections }) => {
  await injections.dockerService.startNode(node);
});

// Bad - direct import prevents mocking
import { dockerService } from '../lib/docker';
```

## Docker & Network Management

### Network Storage

- Networks persisted as JSON in `~/.polar/networks/{id}/network.json`
- Docker volumes in `~/.polar/networks/{id}/volumes/`
- Container naming: `polar-n{networkId}-{nodeName}`

### Port Allocation

Auto-assigned from base ports + node index:

- Bitcoin: 18443 (RPC), 19444 (P2P), 28443 (ZMQ)
- LND: 10001 (REST), 10009 (gRPC), 9735 (P2P)
- CLN: 11001 (REST), 19846 (gRPC), 9735 (P2P)

### Custom Nodes

Users can add custom Docker images. See `docs/custom-nodes.md` for details.

### Platform-Specific Handling

- **Linux**: Injects `USERID`/`GROUPID` env vars for volume permissions
- **Windows**: Path normalization for Docker POSIX format
- **Mac**: Docker Desktop socket detection

## Common Development Patterns

### Adding a New Lightning Implementation

1. Create service in `src/lib/lightning/{impl}Service.ts` implementing `LightningService`
2. Add to `LightningFactory` in `src/lib/lightning/lightningFactory.ts`
3. Add Docker template in `src/lib/docker/composeFile.ts`
4. Update version constants in `src/utils/constants.ts`
5. Add tests for service and integration

### Adding Network Operations

1. Add action/thunk to `src/store/models/network.ts`
2. Inject required services via `helpers.injections`
3. Update UI component to dispatch action
4. Add unit test mocking Docker/Lightning services

### Debugging

- **Main Process Logs**: `~/Library/Logs/polar/main.log` (Mac)
- **Renderer Process**: Open DevTools with `CTRL+SHIFT+I` in dev mode
- **Container Logs**: Accessible via network UI (streaming with react-lazylog)
- **Docker Issues**: Check `docker-compose.yml` in network directory

## Tech Stack Summary

- **Node.js**: v20+ required
- **Electron**: v13 (cross-platform desktop shell)
- **React**: v17 with TypeScript
- **State**: Easy-Peasy (Redux wrapper with less boilerplate)
- **Styling**: Emotion (CSS-in-JS) + Ant Design components
- **Testing**: Jest + React Testing Library + TestCafe (e2e)
- **Lightning APIs**: `@lightningpolar/lnd-api`, `@lightningpolar/tapd-api`
- **Docker**: Dockerode (Node.js Docker API) + docker-compose

## Useful References

- Main README: Overview, features, supported versions
- CONTRIBUTING.md: Detailed setup, Docker devcontainer usage
- docs/custom-nodes.md: Custom Docker image integration
- docs/mcp-architecture.md: MCP server implementation guide (on feat/mcp-server branch)
