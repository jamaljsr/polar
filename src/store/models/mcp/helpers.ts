import { BitcoinNode, LightningNode, LitdNode, Status, TapNode } from 'shared/types';
import { Network } from 'types';
import { mapToTapd } from 'utils/network';

const STATUS_KEYS = new Set(['status', 'nodeStatus']);

const convertStatusValue = (value: unknown): unknown => {
  if (typeof value === 'number') {
    const statusName = Status[value as Status];
    if (statusName !== undefined) {
      return statusName;
    }
  }
  return value;
};

const transformStatuses = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(transformStatuses);
  }

  if (value && typeof value === 'object') {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return value;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const transformed: Record<string, unknown> = {};

    for (const [key, val] of entries) {
      if (STATUS_KEYS.has(key)) {
        transformed[key] = convertStatusValue(val);
      } else {
        transformed[key] = transformStatuses(val);
      }
    }

    return transformed;
  }

  return value;
};

/**
 * Convert numeric Status enum values within MCP tool results to their string labels.
 * This prevents LLM consumers from seeing raw enum numbers (0,1,2,...) and keeps
 * the response structure otherwise untouched.
 */
export const serializeStatusesForMcp = <T>(result: T): T => {
  if (result == null) {
    return result;
  }

  return transformStatuses(result) as T;
};

// Function overloads for type-safe node lookup
export function findNode(
  network: Network,
  nodeName: string,
  type: 'bitcoin',
): BitcoinNode;
export function findNode(
  network: Network,
  nodeName: string,
  type: 'lightning',
): LightningNode;
export function findNode(network: Network, nodeName: string, type: 'litd'): LitdNode;
export function findNode(network: Network, nodeName: string, type: 'tap'): TapNode;
export function findNode(
  network: Network,
  nodeName: string | undefined,
  type: 'bitcoin',
): BitcoinNode;
export function findNode(
  network: Network,
  nodeName: string | undefined,
  type: 'lightning',
): LightningNode;
export function findNode(
  network: Network,
  nodeName?: string,
): BitcoinNode | LightningNode | TapNode;

/**
 * Finds a node in the network by name and type.
 *
 * This function provides type-safe node lookup with the following capabilities:
 * - When `type` is 'bitcoin', returns a BitcoinNode
 * - When `type` is 'lightning', returns a LightningNode
 * - When `type` is 'litd', returns a LitdNode (lightning node with litd implementation)
 * - When `type` is 'tap', returns a TapNode
 * - When `type` is 'bitcoin' and `nodeName` is undefined, returns the first BitcoinNode
 * - When `type` is 'lightning' and `nodeName` is undefined, returns the first LightningNode
 * - When `type` is omitted, searches all node types and returns a CommonNode
 *
 * @param network The network to search in
 * @param nodeName The name of the node to find (optional for bitcoin nodes)
 * @param type The type of node to search for (optional)
 * @returns The found node with the appropriate type
 * @throws If the node is not found or if required conditions are not met
 *
 * @example
 * // Find a specific bitcoin node
 * const btcNode = findNode(network, 'backend1', 'bitcoin');
 *
 * @example
 * // Find first bitcoin node (when nodeName is undefined)
 * const btcNode = findNode(network, undefined, 'bitcoin');
 *
 * @example
 * // Find first lightning node (when nodeName is undefined)
 * const lnNode = findNode(network, undefined, 'lightning');
 *
 * @example
 * // Find a lightning node
 * const lnNode = findNode(network, 'alice', 'lightning');
 *
 * @example
 * // Find a litd node
 * const litdNode = findNode(network, 'litd1', 'litd');
 *
 * @example
 * // Find any node type
 * const anyNode = findNode(network, 'some-node');
 */
export function findNode(
  network: Network,
  nodeName?: string,
  type?: 'bitcoin' | 'lightning' | 'litd' | 'tap',
): BitcoinNode | LightningNode | LitdNode | TapNode {
  // Helper to find a node by name in an array
  const findByName = <T extends { name: string }>(
    nodes: T[],
    name: string,
    typeName: string,
  ): T => {
    const node = nodes.find(n => n.name === name);
    if (!node) {
      throw new Error(`${typeName} node "${name}" not found in network`);
    }
    return node;
  };

  // Helper to get first node from array
  const getFirstNode = <T>(nodes: T[], typeName: string): T => {
    if (nodes.length === 0) {
      throw new Error(`Network has no ${typeName} nodes`);
    }
    return nodes[0];
  };

  // Helper to require nodeName parameter
  const requireNodeName = (name: string | undefined, type?: string): string => {
    if (!name) {
      const errorMessage = type
        ? `Node name is required for ${type} nodes`
        : 'Node name is required when type is not specified';
      throw new Error(errorMessage);
    }
    return name;
  };

  if (type === 'bitcoin') {
    return nodeName
      ? findByName(network.nodes.bitcoin, nodeName, 'Bitcoin')
      : getFirstNode(network.nodes.bitcoin, 'Bitcoin');
  }

  if (type === 'lightning') {
    return nodeName
      ? findByName(network.nodes.lightning, nodeName, 'Lightning')
      : getFirstNode(network.nodes.lightning, 'Lightning');
  }

  if (type === 'litd') {
    const name = requireNodeName(nodeName, type);
    const node = findByName(network.nodes.lightning, name, 'Lightning');
    if (node.implementation !== 'litd') {
      throw new Error(
        `Node "${name}" is not a litd node (implementation: ${node.implementation})`,
      );
    }
    return node as LitdNode;
  }

  if (type === 'tap') {
    const name = requireNodeName(nodeName, type);
    // Find the tap node (can be tapd or litd)
    let node = network.nodes.tap.find(n => n.name === name);
    if (!node) {
      const litdNode = network.nodes.lightning.find(n => n.name === name);
      if (litdNode) {
        node = mapToTapd(litdNode);
      }
    }
    if (!node) {
      throw new Error(`Tap node "${name}" not found in network`);
    }
    return node;
  }

  // No type specified - search all node types
  const name = requireNodeName(nodeName, type);
  const allNodes = [
    ...network.nodes.bitcoin,
    ...network.nodes.lightning,
    ...network.nodes.tap,
  ];
  const node = allNodes.find(n => n.name === name);

  if (!node) {
    throw new Error(`Node "${name}" not found in network "${network.name}"`);
  }

  return node;
}

/**
 * Validates that a network ID is provided.
 *
 * @param networkId The network ID to validate
 * @throws If the network ID is falsy (null, undefined, or 0)
 */
export const validateNetworkId = (networkId: number | null | undefined): void => {
  if (!networkId) {
    throw new Error('Network ID is required');
  }
};

/**
 * Validates that a required string field is provided.
 *
 * @param value The value to validate
 * @param fieldName The name of the field being validated (for error messages)
 * @throws If the value is null, undefined, or empty string
 */
export const validateRequired = (
  value: string | null | undefined,
  fieldName: string,
): void => {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
};

/**
 * Validates that a number is positive.
 *
 * @param value The value to validate
 * @param fieldName The name of the field being validated (for error messages)
 * @throws If the value is null, undefined, or not greater than 0
 */
export const validatePositiveNumber = (
  value: number | null | undefined,
  fieldName: string,
): void => {
  if (value == null || value <= 0) {
    throw new Error(`${fieldName} must be greater than 0`);
  }
};
