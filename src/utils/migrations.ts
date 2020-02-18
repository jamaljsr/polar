import { debug, error } from 'electron-log';
import { join } from 'path';
import { LndNode } from 'shared/types';
import { NetworksFile } from 'types';
import { networksPath } from './config';
import { APP_VERSION } from './constants';
import { getLndFilePaths } from './network';

const v020 = (file: NetworksFile): NetworksFile => {
  debug('Applying v0.2.0 migrations');
  /**
   * the path where network data is stored was moved to a different path. This
   * code ensures that the paths set for the network and the nodes are correct
   */
  file.networks.forEach(network => {
    const pre = `[${network.id}] ${network.name}:`;
    const newPath = join(networksPath, network.id.toString());
    if (network.path !== newPath) {
      debug(`${pre} updating network path from '${network.path}' to '${newPath}'`);
      network.path = newPath;
    }
    network.nodes.bitcoin.forEach(node => {
      if (!node.peers) {
        debug(`${pre} set default peers for Bitcoin node ${node.name}`);
        node.peers = [];
      }
    });
    network.nodes.lightning.forEach(node => {
      if (node.implementation === 'LND') {
        const newPaths = getLndFilePaths(node.name, network);
        if ((node as LndNode).paths.tlsCert !== newPaths.tlsCert) {
          debug(`${pre} updated LND node paths for ${node.name}`);
          (node as LndNode).paths = newPaths;
        }
      }
    });
  });

  /**
   * In v0.1.0 bitcoin nodes did not have ports on the left & right because multiple nodes was
   * not supported. In v0.2.0, there can be multiple bitcoin nodes, so it is expected for each
   * node to have left/right ports. This code ensures that these ports exist
   */
  Object.entries(file.charts).forEach(([id, chart]) => {
    const pre = `[${id}]:`;
    Object.values(chart.nodes).forEach(node => {
      if (node.type === 'bitcoin') {
        if (!node.ports['peer-left']) {
          debug(`${pre} adding peer-left port to ${node.id} in chart`);
          node.ports['peer-left'] = { id: 'peer-left', type: 'left' };
        }
        if (!node.ports['peer-right']) {
          debug(`${pre} adding peer-right port to ${node.id} in chart`);
          node.ports['peer-right'] = { id: 'peer-right', type: 'right' };
        }
      }
    });
  });

  return file;
};

const v030 = (file: NetworksFile): NetworksFile => {
  debug('Applying v0.3.0 migrations');

  /**
   * the docker property was added to bitcoin and lightning
   * nodes to save a custom startup command
   */
  file.networks.forEach(network => {
    const pre = `[${network.id}] ${network.name}:`;
    network.nodes.bitcoin.forEach(node => {
      if (!node.docker) {
        debug(`${pre} set docker details for Bitcoin node ${node.name}`);
        node.docker = { image: '', command: '' };
      }
    });
    network.nodes.lightning.forEach(node => {
      if (!node.docker) {
        debug(`${pre} set docker details for ${node.implementation} node ${node.name}`);
        node.docker = { image: '', command: '' };
      }
    });
  });

  return file;
};

/**
 * The list of migration functions to execute
 */
const migrations = [v020, v030];

/**
 * Migrates network and chart data from a previous app version
 * @param file the data from the `networks.json` file
 */
export const migrateNetworksFile = (file: NetworksFile): NetworksFile => {
  try {
    debug(`Upgrading networks file to v${APP_VERSION}`);
    // loop over each migration function in the array
    const migrated = migrations.reduce((currFile, migrationFunc) => {
      // execute the migration and return the result
      return migrationFunc(currFile);
    }, file);

    migrated.version = APP_VERSION;
    debug('Migrations complete');
    return migrated;
  } catch (e) {
    error('Unable to migrate the networks.json file', e);
    return file;
  }
};
