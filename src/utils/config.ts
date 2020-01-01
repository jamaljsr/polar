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
 * legacy path where application data was stored in v0.1.0
 */
export const legacyDataPath = join(remote.app.getPath('userData'), 'data');

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
