import { IpcSender } from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import lndService from './lndService';

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
});
