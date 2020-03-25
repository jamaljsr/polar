import { CommonNode, Status } from 'shared/types';
import { CustomImage, ManagedImage, Network } from 'types';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from '../network';

export const testNodeDocker: CommonNode['docker'] = { image: '', command: '' };

export const testManagedImages: ManagedImage[] = [
  { implementation: 'LND', version: defaultRepoState.images.LND.latest, command: '' },
  {
    implementation: 'c-lightning',
    version: defaultRepoState.images['c-lightning'].latest,
    command: '',
  },
  {
    implementation: 'eclair',
    version: defaultRepoState.images.eclair.latest,
    command: '',
  },
  {
    implementation: 'bitcoind',
    version: defaultRepoState.images.bitcoind.latest,
    command: '',
  },
];

export const testCustomImages: CustomImage[] = [
  {
    id: '123',
    name: 'My Custom Image',
    implementation: 'LND',
    dockerImage: 'lnd:master',
    command: 'test-command',
  },
  {
    id: '456',
    name: 'Another Custom Image',
    implementation: 'c-lightning',
    dockerImage: 'my-clightning:latest',
    command: 'another-command',
  },
  {
    id: '789',
    name: 'One More Custom Image',
    implementation: 'eclair',
    dockerImage: 'my-eclair:latest',
    command: 'another-command',
  },
];

export const getNetwork = (networkId = 1, name?: string, status?: Status): Network =>
  createNetwork({
    id: networkId,
    name: name || 'my-test',
    lndNodes: 2,
    clightningNodes: 1,
    eclairNodes: 1,
    bitcoindNodes: 1,
    status,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
  });

export const mockProperty = <T extends {}, K extends keyof T>(
  object: T,
  property: K,
  value: T[K],
) => {
  Object.defineProperty(object, property, { get: () => value });
};

/**
 * Poor man's deep clone. Useful for tests to avoid another dependency
 */
export const clone = (data: object) => JSON.parse(JSON.stringify(data));

/**
 * Suppresses console errors when executing some code.
 * For example: antd Modal.confirm logs a console error when onOk fails
 * this suppresses those errors from being displayed in test runs
 * @param func the code to run
 */
export const suppressConsoleErrors = async (func: () => any | Promise<any>) => {
  const oldConsoleErr = console.error;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = () => {};
  const result = func();
  if (result && typeof result.then === 'function') {
    await result;
  }
  console.error = oldConsoleErr;
};
