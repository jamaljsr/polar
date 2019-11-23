import { Status } from 'shared/types';
import { Network } from 'types';
import { createNetwork } from '../network';

export const getNetwork = (networkId = 1, name?: string, status?: Status): Network =>
  createNetwork({
    id: networkId,
    name: name || 'my-test',
    lndNodes: 2,
    clightningNodes: 0,
    bitcoindNodes: 1,
    status,
  });

export const mockProperty = <T extends {}, K extends keyof T>(
  object: T,
  property: K,
  value: T[K],
) => {
  Object.defineProperty(object, property, { get: () => value });
};

/**
 * Suppresses console errors when executing some code.
 * For example: antd Modal.confirm logs a console error when onOk fails
 * this supresses those errors from being displayed in test runs
 * @param func the code to run
 */
export const suppressConsoleErrors = async (func: () => any | Promise<any>) => {
  const oldConsoleErr = console.error;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = () => {};
  const result = func();
  if (typeof result.then === 'function') {
    await result;
  }
  console.error = oldConsoleErr;
};
