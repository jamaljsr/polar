import { IpcSender } from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
// import * as asyncUtil from 'utils/async';
import lndService from './lndService';

// jest.mock('utils/async');
// const asyncUtilMock = asyncUtil as jest.Mocked<typeof asyncUtil>;

describe('LndService', () => {
  const node = getNetwork().nodes.lightning[0];
  let actualIpc: IpcSender;

  beforeEach(() => {
    actualIpc = lndService.ipc;
    // mock the ipc dependency
    lndService.ipc = jest.fn();
  });

  afterEach(() => {
    // restore the actual ipc implementation
    lndService.ipc = actualIpc;
  });

  it('should call the getInfo ipc', () => {
    lndService.getInfo(node);
    expect(lndService.ipc).toBeCalledWith('get-info', { node });
  });

  describe('waitUntilOnline', () => {
    it('should return true when successful', async () => {
      const ipc = lndService.ipc as jest.Mock;
      ipc.mockResolvedValue({});
      const result = await lndService.waitUntilOnline(node);
      expect(result).toBe(true);
      expect(ipc).toBeCalledTimes(1);
    });

    it('should return false on failure', async () => {
      const ipc = lndService.ipc as jest.Mock;
      ipc.mockRejectedValue(new Error());
      const result = await lndService.waitUntilOnline(node, 0.5, 1);
      expect(result).toBe(false);
      expect(ipc).toBeCalledTimes(5);
    });
  });
});
