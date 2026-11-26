import { debug, error } from 'electron-log';
import { join } from 'path';
import { CLightningNode, LndNode } from 'shared/types';
import { AutoMineMode, NetworksFile } from 'types';
import { networksPath } from './config';
import { APP_VERSION, BasePorts, dockerConfigs } from './constants';
import { getCLightningFilePaths, getLndFilePaths } from './network';
import { isVersionCompatible } from './strings';

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

  file.networks.forEach(network => {
    const pre = `[${network.id}] ${network.name}:`;
    network.nodes.bitcoin.forEach(node => {
      // the docker property was added to bitcoin nodes to save a custom startup command
      if (!node.docker) {
        debug(`${pre} set docker details for Bitcoin node ${node.name}`);
        node.docker = { image: '', command: '' };
      }
      // the zmq ports were added to bitcoind nodes in PR #297 (btcd doesn't support ZMQ)
      if (node.implementation === 'bitcoind') {
        if (!node.ports.zmqBlock) {
          debug(`${pre} set ZMQ Blocks port for Bitcoin node ${node.name}`);
          node.ports.zmqBlock = BasePorts.bitcoind.zmqBlock;
        }
        if (!node.ports.zmqTx) {
          debug(`${pre} set ZMQ Txns port for Bitcoin node ${node.name}`);
          node.ports.zmqTx = BasePorts.bitcoind.zmqTx;
        }
      }
    });
    network.nodes.lightning.forEach(node => {
      // the docker property was added to lightning nodes to save a custom startup command
      if (!node.docker) {
        debug(`${pre} set docker details for ${node.implementation} node ${node.name}`);
        node.docker = { image: '', command: '' };
      }
      // the p2p ports were added to bitcoin nodes in PR #301
      if (!node.ports.p2p) {
        const port = BasePorts[node.implementation].p2p;
        debug(`${pre} set P2P port ${port} for ${node.implementation} node ${node.name}`);
        node.ports.p2p = port;
      }

      // update the LND logo path
      if (node.implementation === 'LND') {
        const props = file.charts[network.id].nodes[node.name].properties;
        if (props && props.icon !== dockerConfigs.LND.logo) {
          debug(`${pre} update LND logo icon for chart node ${node.name}`);
          props.icon = dockerConfigs.LND.logo;
        }
      }
    });
  });

  return file;
};

const v110 = (file: NetworksFile): NetworksFile => {
  debug('Applying v1.1.0 migrations');

  file.networks.forEach(network => {
    const pre = `[${network.id}] ${network.name}:`;
    network.nodes.bitcoin.forEach(node => {
      // the p2p port was added to bitcoin nodes in PR #372
      if (!node.ports.p2p) {
        debug(`${pre} set P2P port for Bitcoin node ${node.name}`);
        node.ports.p2p = BasePorts.bitcoind.p2p;
      }
    });
    network.nodes.lightning.forEach(node => {
      // set the invoice macaroon path for old networks
      if (node.implementation === 'LND' && !(node as LndNode).paths.invoiceMacaroon) {
        debug(`${pre} update LND invoice macaroon path for ${node.name}`);
        const newPaths = getLndFilePaths(node.name, network);
        (node as LndNode).paths = newPaths;
      }
    });
  });

  return file;
};

const v140 = (file: NetworksFile): NetworksFile => {
  debug('Applying v1.4.0 migrations');

  file.networks.forEach(network => {
    const pre = `[${network.id}] ${network.name}:`;
    network.nodes.lightning.forEach(node => {
      // the TLS paths were changed in PR #584
      const supportsGrpc = !isVersionCompatible(node.version, '0.10.2');
      if (
        node.implementation === 'c-lightning' &&
        supportsGrpc &&
        !(node as CLightningNode).paths.tlsClientCert
      ) {
        debug(`${pre} update c-lightning TLS paths for ${node.name}`);
        const newPaths = getCLightningFilePaths(node.name, true, network);
        (node as CLightningNode).paths = newPaths;
      }
    });
  });

  return file;
};

const v200 = (file: NetworksFile): NetworksFile => {
  debug('Applying v2.0.0 migrations');

  file.networks.forEach(network => {
    const pre = `[${network.id}] ${network.name}:`;
    // the autoMineMode property was added in PR #707
    if (network.autoMineMode === undefined) {
      debug(`${pre} set autoMineMode to 'AutoOff'`);
      network.autoMineMode = AutoMineMode.AutoOff;
    }
    // tapd nodes was added to networks in PR #641
    if (network.nodes.tap === undefined) {
      debug(`${pre} add tap node list to network`);
      network.nodes.tap = [];
    }

    network.nodes.lightning
      .filter(n => n.implementation === 'LND')
      .forEach(node => {
        const chartNode = file.charts[network.id].nodes[node.name];
        if (!chartNode.ports['lndbackend']) {
          debug(`${pre} add lndbackend port to LND chart node ${node.name}`);
          chartNode.ports['lndbackend'] = { id: 'lndbackend', type: 'top' };
        }
      });
  });

  return file;
};

/**
 * The list of migration functions to execute
 */
const migrations = [v020, v030, v110, v140, v200];

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
