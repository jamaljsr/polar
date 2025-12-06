import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { NodeImplementation } from 'shared/types';
import { RootModel } from 'store/models';
import { validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { DockerRepoState, Network, StoreInjections } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { compareVersions, isVersionCompatible } from 'utils/strings';

/** The arguments for the create_network tool */
export interface CreateNetworkArgs {
  name: string;
  description?: string;
  nodes?: CreateNetworkNodeRequest[];
}

export interface CreateNetworkNodeRequest {
  implementation: NodeImplementation;
  version?: string;
  count?: number;
}

/** The result of the create_network tool */
export interface CreateNetworkResult {
  success: boolean;
  network: Network;
  message: string;
}

interface NormalizedNodeRequest {
  implementation: NodeImplementation;
  version: string;
}

interface NetworkPlan {
  baseCounts: {
    lndNodes: number;
    clightningNodes: number;
    eclairNodes: number;
    bitcoindNodes: number;
    tapdNodes: number;
    litdNodes: number;
  };
  additionalNodes: NormalizedNodeRequest[];
}

interface PlanContext {
  baseCounts: NetworkPlan['baseCounts'];
  additionalNodes: NormalizedNodeRequest[];
  bitcoindVersions: Set<string>;
}

const SUPPORTED_IMPLEMENTATIONS: NodeImplementation[] = [
  'bitcoind',
  'LND',
  'c-lightning',
  'eclair',
  'litd',
  'tapd',
];

const ADDITION_PRIORITY: readonly NodeImplementation[] = [
  'bitcoind',
  'LND',
  'c-lightning',
  'eclair',
  'litd',
  'tapd',
];

const LIGHTNING_IMPLEMENTATIONS = new Set<NodeImplementation>([
  'LND',
  'c-lightning',
  'eclair',
  'litd',
]);

const DEFAULT_NODE_REQUESTS: CreateNetworkNodeRequest[] = [
  { implementation: 'LND', count: 2 },
  { implementation: 'bitcoind', count: 1 },
];

const toPositiveInteger = (
  value: number | undefined,
  implementation: NodeImplementation,
) => {
  if (value === undefined) return 1;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Invalid count "${value}" for ${implementation}. Provide a positive integer value.`,
    );
  }
  return value;
};

const hasBitcoindUpTo = (requiredVersion: string | undefined, versions: Set<string>) => {
  if (!requiredVersion) return true;
  for (const version of versions) {
    if (isVersionCompatible(version, requiredVersion)) {
      return true;
    }
  }
  return false;
};

const hasLndAtLeast = (minVersion: string | undefined, versions: Set<string>) => {
  if (!minVersion) return true;
  for (const version of versions) {
    if (compareVersions(version, minVersion) >= 0) {
      return true;
    }
  }
  return false;
};

const normalizeNodeRequests = (
  requestedNodes: CreateNetworkNodeRequest[] | undefined,
  repoState: DockerRepoState,
): NormalizedNodeRequest[] => {
  // Default the request list when the caller omits it, otherwise prune falsy entries
  const inputs =
    requestedNodes === undefined ? DEFAULT_NODE_REQUESTS : requestedNodes.filter(Boolean);

  const normalized: NormalizedNodeRequest[] = [];

  inputs.forEach(request => {
    // Every node entry must declare an implementation so we know which templates to use later
    const implementation = request.implementation;
    if (!implementation) {
      throw new Error('Each node entry must include an implementation.');
    }
    // Reject requests for node types the tooling cannot provision
    if (!SUPPORTED_IMPLEMENTATIONS.includes(implementation)) {
      throw new Error(
        `Unsupported implementation "${implementation}". Supported implementations: ${SUPPORTED_IMPLEMENTATIONS.join(
          ', ',
        )}.`,
      );
    }

    // Look up the repository metadata for the implementation so we can validate versions
    const repoImage = repoState.images[implementation];
    if (!repoImage) {
      throw new Error(
        `Implementation "${implementation}" is not available in the current repo state.`,
      );
    }

    // Ensure counts are positive integers before expanding the entry
    const count = toPositiveInteger(request.count, implementation);
    const trimmedVersion = request.version?.trim();
    // Pinned versions must exist in the repo metadata to avoid creating impossible nodes
    if (trimmedVersion && !repoImage.versions.includes(trimmedVersion)) {
      throw new Error(
        `Version "${trimmedVersion}" is not supported for ${implementation}. Supported versions: ${repoImage.versions.join(
          ', ',
        )}.`,
      );
    }

    // Expand the high-level request into discrete node entries that the planner can reason about
    const resolvedVersion = trimmedVersion || repoImage.latest;
    for (let i = 0; i < count; i += 1) {
      normalized.push({ implementation, version: resolvedVersion });
    }
  });

  return normalized;
};

const buildPlanContext = (
  normalized: NormalizedNodeRequest[],
  repoState: DockerRepoState,
): PlanContext => {
  // Base counts form the payload sent to addNetwork(); they must match the latest repo defaults
  const baseCounts = {
    lndNodes: 0,
    clightningNodes: 0,
    eclairNodes: 0,
    bitcoindNodes: 0,
    tapdNodes: 0,
    litdNodes: 0,
  };

  const additionalNodes: NormalizedNodeRequest[] = [];
  const bitcoindCandidates: NormalizedNodeRequest[] = [];

  normalized.forEach(node => {
    // Bitcoind is processed separately so we can align versions with LND compatibility
    if (node.implementation === 'bitcoind') {
      bitcoindCandidates.push(node);
      return;
    }

    const latestVersion = repoState.images[node.implementation].latest;
    // Latest-version nodes can be created in the initial addNetwork payload; other versions get queued
    if (node.version === latestVersion) {
      switch (node.implementation) {
        case 'LND':
          baseCounts.lndNodes += 1;
          return;
        case 'c-lightning':
          baseCounts.clightningNodes += 1;
          return;
        case 'eclair':
          baseCounts.eclairNodes += 1;
          return;
        case 'litd':
          baseCounts.litdNodes += 1;
          return;
        case 'tapd':
          baseCounts.tapdNodes += 1;
          return;
      }
    }

    additionalNodes.push(node);
  });

  // Use the repo metadata to select the default bitcoind version, favouring LND compatibility when needed
  const latestBitcoind = repoState.images.bitcoind.latest;
  const latestLnd = repoState.images.LND.latest;
  const lndCompatibility = repoState.images.LND.compatibility || {};

  let defaultBitcoindVersion = latestBitcoind;
  if (baseCounts.lndNodes > 0) {
    const compatibleBitcoind = lndCompatibility[latestLnd];
    if (compatibleBitcoind) {
      defaultBitcoindVersion = compatibleBitcoind;
    }
  }

  // Bitcoind nodes using the default version can be batched; the rest are deferred to addNode()
  bitcoindCandidates.forEach(node => {
    if (node.version === defaultBitcoindVersion) {
      baseCounts.bitcoindNodes += 1;
      return;
    }

    additionalNodes.push(node);
  });

  // Track every bitcoind version we will end up with; this drives later compatibility checks
  const bitcoindVersions = new Set<string>();
  if (baseCounts.bitcoindNodes > 0) {
    bitcoindVersions.add(defaultBitcoindVersion);
  }
  additionalNodes
    .filter(node => node.implementation === 'bitcoind')
    .forEach(node => bitcoindVersions.add(node.version));

  // Queue nodes so that dependencies are added before consumers (bitcoin → LND → tapd)
  additionalNodes.sort(
    (a, b) =>
      ADDITION_PRIORITY.indexOf(a.implementation) -
      ADDITION_PRIORITY.indexOf(b.implementation),
  );

  return { baseCounts, additionalNodes, bitcoindVersions };
};

const validateNetworkDependencies = ({
  baseCounts,
  additionalNodes,
  bitcoindVersions,
}: PlanContext) => {
  // Lightning nodes (LND, CLN, eclair, litd) cannot run without at least one bitcoind backend
  const additionalLightningCount = additionalNodes.filter(node =>
    LIGHTNING_IMPLEMENTATIONS.has(node.implementation),
  ).length;
  const totalLightningNodes =
    baseCounts.lndNodes +
    baseCounts.clightningNodes +
    baseCounts.eclairNodes +
    baseCounts.litdNodes +
    additionalLightningCount;

  // tapd requires LND; track both totals to enforce the one-to-one requirement
  const additionalTapdCount = additionalNodes.filter(
    node => node.implementation === 'tapd',
  ).length;
  const totalTapdNodes = baseCounts.tapdNodes + additionalTapdCount;

  const additionalLndCount = additionalNodes.filter(
    node => node.implementation === 'LND',
  ).length;
  const totalLndNodes = baseCounts.lndNodes + additionalLndCount;

  if (totalLightningNodes > 0 && bitcoindVersions.size === 0) {
    throw new Error(
      'Lightning nodes require at least one bitcoind backend. Add a bitcoind entry to the nodes list.',
    );
  }

  if (totalTapdNodes > 0 && totalLndNodes === 0) {
    throw new Error('Tapd nodes require at least one LND node to act as a backend.');
  }

  if (totalTapdNodes > totalLndNodes) {
    throw new Error(
      'Each tapd node requires a dedicated LND backend. Increase the number of LND nodes or reduce tapd nodes.',
    );
  }
};

const validateCompatibility = (context: PlanContext, repoState: DockerRepoState) => {
  const { baseCounts, additionalNodes, bitcoindVersions } = context;

  // Collate every LND version the network will contain so we can enforce bitcoind compatibility bounds
  const lndVersions = new Set<string>();
  if (baseCounts.lndNodes > 0) {
    lndVersions.add(repoState.images.LND.latest);
  }
  additionalNodes
    .filter(node => node.implementation === 'LND')
    .forEach(node => lndVersions.add(node.version));

  const lndCompatibility = repoState.images.LND.compatibility || {};
  for (const version of lndVersions) {
    const requiredBitcoind = lndCompatibility[version];
    const isCompatible = hasBitcoindUpTo(requiredBitcoind, bitcoindVersions);
    if (!isCompatible) {
      throw new Error(
        `LND version ${version} requires a bitcoind node at version ${requiredBitcoind} ` +
          `or lower. Add a compatible bitcoind node.`,
      );
    }
  }

  // litd embeds LND; the docker image metadata exposes the same bitcoind compatibility requirements
  const litdVersions = new Set<string>();
  if (baseCounts.litdNodes > 0) {
    litdVersions.add(repoState.images.litd.latest);
  }
  additionalNodes
    .filter(node => node.implementation === 'litd')
    .forEach(node => litdVersions.add(node.version));

  const litdCompatibility = repoState.images.litd.compatibility || {};
  for (const version of litdVersions) {
    const requiredBitcoind = litdCompatibility[version];
    const isCompatible = hasBitcoindUpTo(requiredBitcoind, bitcoindVersions);
    if (!isCompatible) {
      throw new Error(
        `litd version ${version} requires a bitcoind node at version ${requiredBitcoind} ` +
          `or lower. Add a compatible bitcoind node.`,
      );
    }
  }

  // Tapd depends on an LND backend with a minimum supported version; validate the aggregated set
  const tapdVersions = new Set<string>();
  if (baseCounts.tapdNodes > 0) {
    tapdVersions.add(repoState.images.tapd.latest);
  }
  additionalNodes
    .filter(node => node.implementation === 'tapd')
    .forEach(node => tapdVersions.add(node.version));

  const tapdCompatibility = repoState.images.tapd.compatibility || {};
  for (const version of tapdVersions) {
    const minLndVersion = tapdCompatibility[version];
    const isCompatible = hasLndAtLeast(minLndVersion, lndVersions);
    if (!isCompatible) {
      throw new Error(
        `tapd version ${version} requires an LND node at version ${minLndVersion} or higher. Add a compatible LND node.`,
      );
    }
  }
};

const prepareNetworkPlan = (
  requestedNodes: CreateNetworkNodeRequest[] | undefined,
  repoState: DockerRepoState,
): NetworkPlan => {
  // Break down the high-level request into individual nodes we can plan around
  const normalized = normalizeNodeRequests(requestedNodes, repoState);
  // Classify nodes into base counts and staged additions while gathering dependency cues
  const context = buildPlanContext(normalized, repoState);
  // Guard against obvious configuration mistakes (missing backends, insufficient LND nodes, etc.)
  validateNetworkDependencies(context);
  // Finally, ensure the requested version matrix satisfies repo-defined compatibility rules
  validateCompatibility(context, repoState);

  return {
    baseCounts: context.baseCounts,
    additionalNodes: context.additionalNodes,
  };
};

/** The definition of the create_network tool which will be provided to the LLM */
export const createNetworkDefinition: McpToolDefinition = {
  name: 'create_network',
  description:
    'Creates a new Lightning Network in Polar with the specified node implementations and versions. ' +
    'Use the list_node_versions tool to see supported versions. Nodes that omit a version will use the latest available.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the network',
      },
      description: {
        type: 'string',
        description: 'Description of the network',
      },
      nodes: {
        type: 'array',
        description:
          'List of nodes to include in the new network. Each entry may specify a version and count (defaults to 1).',
        items: {
          type: 'object',
          properties: {
            implementation: {
              type: 'string',
              enum: ['bitcoind', 'LND', 'c-lightning', 'eclair', 'litd', 'tapd'],
              description: 'Node implementation to add to the network',
            },
            version: {
              type: 'string',
              description:
                'Version of the implementation to use (optional). Latest version is used when omitted.',
            },
            count: {
              type: 'integer',
              minimum: 1,
              description: 'Number of nodes of this type to create (default: 1)',
            },
          },
          required: ['implementation'],
        },
      },
    },
    required: ['name'],
  },
};

/** The implementation for the create_network tool */
export const createNetworkTool = thunk<
  Record<string, never>,
  CreateNetworkArgs,
  StoreInjections,
  RootModel,
  Promise<CreateNetworkResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateRequired(args.name, 'Network name');

  // The app state always initializes dockerRepoState with defaultRepoState,
  // so this will never be undefined in practice
  const effectiveRepoState = getStoreState().app.dockerRepoState;
  const { baseCounts, additionalNodes } = prepareNetworkPlan(
    args.nodes,
    effectiveRepoState,
  );

  const networkArgs = {
    name: args.name,
    description: args.description || '',
    lndNodes: baseCounts.lndNodes,
    clightningNodes: baseCounts.clightningNodes,
    eclairNodes: baseCounts.eclairNodes,
    bitcoindNodes: baseCounts.bitcoindNodes,
    tapdNodes: baseCounts.tapdNodes,
    litdNodes: baseCounts.litdNodes,
    customNodes: {},
    manualMineCount: 6,
  };

  info('MCP: Creating network with plan:', {
    name: args.name,
    baseCounts,
    additionalNodes,
  });

  const storeActions = getStoreActions();
  await storeActions.network.addNetwork(networkArgs);

  let { networks } = getStoreState().network;
  const createdNetwork = networks[networks.length - 1];

  for (const node of additionalNodes) {
    await storeActions.network.addNode({
      id: createdNetwork.id,
      type: node.implementation,
      version: node.version,
    });
  }

  networks = getStoreState().network.networks;
  const updatedNetwork = networks.find(n => n.id === createdNetwork.id);
  if (!updatedNetwork) {
    throw new Error('Unable to locate the newly created network after creation.');
  }

  if (additionalNodes.length > 0) {
    const chart = initChartFromNetwork(updatedNetwork);
    storeActions.designer.setChart({ id: updatedNetwork.id, chart });
    storeActions.designer.setActiveId(updatedNetwork.id);
  }

  return {
    success: true,
    network: updatedNetwork,
    message: `Network "${networkArgs.name}" created successfully`,
  };
});
