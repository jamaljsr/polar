import { debug } from 'electron-log';
import { join } from 'path';
import { IChart } from '@mrblenny/react-flow-chart';
import { LndNode } from 'shared/types';
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
    debug(`Migrating chart for network with id #${id}`);
    Object.values(chart.nodes).forEach(node => {
      if (node.type === 'bitcoin') {
        if (!node.ports['peer-left']) {
          debug(`[v0.2.0] adding peer-left port to ${node.id} in chart`);
          node.ports['peer-left'] = { id: 'peer-left', type: 'left' };
        }
        if (!node.ports['peer-right']) {
          debug(`[v0.2.0] adding peer-right port to ${node.id} in chart`);
          node.ports['peer-right'] = { id: 'peer-right', type: 'right' };
        }
      }
    });
  });
  return charts;
};

/**
 * v0.1.0 -> v0.2.0: the path where network data is stored
 * was moved to a different path. This function ensures that the paths set for
 * the network and the nodes are correct, as the networks folder could have
 * been moved manually
 * v0.2.1 -> 0.3.0: the docker property was added to bitcoin and lightning
 * nodes to save a custom startup command
 * @param networks the list of networks to migrate
 */
const migrateNetworks = (networks: Network[]): Network[] => {
  networks.forEach(network => {
    debug(`Migrating network '${network.name}' id #${network.id}`);
    const newPath = join(networksPath, network.id.toString());
    if (network.path !== newPath) {
      debug(`[v0.2.0] updating network path from '${network.path}' to '${newPath}'`);
      network.path = newPath;
    }
    network.nodes.bitcoin.forEach(node => {
      if (!node.peers) {
        debug(`[v0.2.0] set default peers for Bitcoin node ${node.name}`);
        node.peers = [];
      }
      if (!node.docker) {
        debug(`[v0.3.0] set docker command for Bitcoin node ${node.name}`);
        node.docker = { command: '' };
      }
    });
    network.nodes.lightning.forEach(node => {
      if (!node.docker) {
        debug(`[v0.3.0] set docker command for ${node.implementation} node ${node.name}`);
        node.docker = { command: '' };
      }
      if (node.implementation === 'LND') {
        const newPaths = getLndFilePaths(node.name, network);
        if ((node as LndNode).paths.tlsCert !== newPaths.tlsCert) {
          debug(`[v0.2.0] updated LND node paths for ${node.name}`);
          (node as LndNode).paths = newPaths;
        }
      }
    });
  });
  return networks;
};

/**
 * Migrates network and chart data from a previous app version
 * @param file the data from the `networks.json` file
 */
export const migrateNetworksFile = (file: NetworksFile): NetworksFile => {
  debug(`Upgrading networks file to v${APP_VERSION}`);
  const migrated = {
    version: APP_VERSION,
    networks: migrateNetworks(file.networks),
    charts: migrateCharts(file.charts),
  };
  debug('Migrations complete');
  return migrated;
};
