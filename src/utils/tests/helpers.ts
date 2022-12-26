import { CommonNode, Status } from 'shared/types';
import { CustomImage, DockerRepoState, ManagedImage, Network } from 'types';
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

export const testRepoState: DockerRepoState = {
  version: 35,
  images: {
    LND: {
      latest: '0.14.2-beta',
      versions: [
        '0.14.2-beta',
        '0.14.1-beta',
        '0.13.1-beta',
        '0.13.0-beta',
        '0.12.1-beta',
        '0.12.0-beta',
        '0.11.1-beta',
        '0.11.0-beta',
        '0.10.3-beta',
        '0.10.2-beta',
        '0.10.1-beta',
        '0.10.0-beta',
        '0.9.1-beta',
        '0.9.0-beta',
        '0.8.2-beta',
        '0.8.0-beta',
        '0.7.1-beta',
      ],
      // not all LND versions are compatible with all bitcoind versions.
      // this mapping specifies the highest compatible bitcoind for each LND version
      compatibility: {
        '0.14.2-beta': '22.0',
        '0.14.1-beta': '22.0',
        '0.13.1-beta': '22.0',
        '0.13.0-beta': '22.0',
        '0.12.1-beta': '22.0',
        '0.12.0-beta': '22.0',
        '0.11.1-beta': '22.0',
        '0.11.0-beta': '22.0',
        '0.10.3-beta': '22.0',
        '0.10.2-beta': '22.0',
        '0.10.1-beta': '0.19.1',
        '0.10.0-beta': '0.19.1',
        '0.9.1-beta': '0.19.1',
        '0.9.0-beta': '0.19.1',
        '0.8.2-beta': '0.19.1',
        '0.8.0-beta': '0.18.1',
        '0.7.1-beta': '0.18.1',
      },
    },
    'c-lightning': {
      latest: '0.11.2',
      versions: [
        '0.11.2',
        '0.10.2',
        '0.10.0',
        '0.9.3',
        '0.9.2',
        '0.9.1',
        '0.9.0',
        '0.8.2',
        '0.8.1',
        '0.8.0',
      ],
    },
    eclair: {
      latest: '0.7.0',
      versions: ['0.7.0', '0.6.2', '0.6.1', '0.6.0', '0.5.0', '0.4.2'],
    },
    bitcoind: {
      latest: '22.0',
      versions: [
        '22.0',
        '0.21.1',
        '0.21.0',
        '0.20.1',
        '0.20.0',
        '0.19.1',
        '0.19.0.1',
        '0.18.1',
      ],
    },
    btcd: {
      latest: '',
      versions: [],
    },
    tarod: {
      latest: '0.1.1-alpha',
      versions: ['0.1.1-alpha'],
    },
  },
};

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

export const mockProperty = <T, K extends keyof T>(
  object: T,
  property: K,
  value: T[K],
) => {
  Object.defineProperty(object, property, { get: () => value });
};

/**
 * Poor man's deep clone. Useful for tests to avoid another dependency
 */
export const clone = (data: any) => JSON.parse(JSON.stringify(data));

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
