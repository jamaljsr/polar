import { debug } from 'electron-log';
import { join } from 'path';
import { IChart } from '@mrblenny/react-flow-chart';
import { BitcoinNode, LightningNode } from 'shared/types';
import { Network, NetworksFile } from 'types';
import { networksPath } from './config';
import { APP_VERSION } from './constants';
import { getLndFilePaths } from './network';

/**
 * In v0.1.0 bitcoin nodes did not have ports on the left & right because multiple nodes was
 * not supported. In v0.2.0, there can be multiple bitcoin nodes, so it is expected for each
 * node to have left/right ports. This function ensures that these ports exist
 * @param charts the charts to migrate
 */
const migrateCharts = (charts: Record<number, IChart>): Record<number, IChart> => {
  Object.entries(charts).forEach(([id, chart]) => {
    Object.values(chart.nodes).forEach(node => {
      if (node.type === 'bitcoin') {
        debug(`Migrating chart for network ID #${id}`);
        debug(`adding peer-left port to ${node.id}`);
        node.ports['peer-left'] = { id: 'peer-left', type: 'left' };
        debug(`adding peer-right port to ${node.id}`);
        node.ports['peer-right'] = { id: 'peer-right', type: 'right' };
      }
    });
  });
  return charts;
};

/**
 * In the upgrade from v0.1.0 to v0.2.0, the path where network data is stored
 * was moved to a different path. This function ensures that the paths set for
 * the network and the nodes are correct, as the networks folder could have
 * been moved manually
 * @param networks the list of networks to migrate
 */
const migrateNetworks = (networks: Network[]): Network[] => {
  const migrateBitcoinNodes = (network: Network): BitcoinNode[] => {
    return network.nodes.bitcoin.map(node => {
      debug(`updated Bitcoin node peers for ${node.name}`);
      return {
        ...node,
        peers: [],
      };
    });
  };
  const migrateLightningNodes = (network: Network): LightningNode[] => {
    return network.nodes.lightning.map(node => {
      if (node.implementation === 'LND') {
        debug(`updated LND node paths for ${node.name}`);
        return {
          ...node,
          paths: getLndFilePaths(node.name, network),
        };
      }
      return node;
    });
  };

  return networks.map(n => {
    debug(`Migrating paths in network ${n.name} #${n.id}`);
    const network = {
      ...n,
      path: join(networksPath, n.id.toString()),
    };
    debug(`updated network path from '${n.path}' to '${network.path}'`);
    network.nodes.bitcoin = migrateBitcoinNodes(network);
    network.nodes.lightning = migrateLightningNodes(network);
    return network;
  });
};

/**
 * Migrates network and chart data that was created in v0.1.0 to work with v0.2.0
 * @param file the data from the `networks.json` file
 */
export const migrateNetworksFile = (file: NetworksFile): NetworksFile => {
  debug(`Upgrading networks file to v${APP_VERSION}`);
  const migrated = {
    version: APP_VERSION,
    networks: migrateNetworks(file.networks),
    charts: migrateCharts(file.charts),
  };
  debug('migrations complete');
  return migrated;
};
