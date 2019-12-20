import { remote } from 'electron';
import { join } from 'path';
import { NodeImplementation } from 'shared/types';
import { Network } from 'types';
import { dockerConfigs } from './constants';

/**
 * root path where application data is stored
 */
export const dataPath = join(remote.app.getPath('home'), '.polar');

/**
 * path where networks data is stored
 */
export const networksPath = join(dataPath, 'networks');

/**
 * returns a path to store dtat for an individual node
 */
export const nodePath = (
  network: Network,
  implementation: NodeImplementation,
  name: string,
): string =>
  join(network.path, 'volumes', dockerConfigs[implementation].volumeDirName, name);
