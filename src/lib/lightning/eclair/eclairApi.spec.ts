import { EclairNode } from 'shared/types';
import * as ipc from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import { httpPost } from './eclairApi';

jest.mock('lib/ipc/ipcService');

const ipcMock = ipc as jest.Mocked<typeof ipc>;

describe('EclairApi', () => {
  const node = getNetwork().nodes.lightning[2] as EclairNode;

  it('should throw an error for an incorrect node implementation', async () => {
    const lnd = getNetwork().nodes.lightning[0];
    await expect(httpPost(lnd, 'get-ok')).rejects.toThrow(
      "EclairService cannot be used for 'LND' nodes",
    );
  });

  it('should perform an unsuccessful httpPost', async () => {
    const sender = jest.fn().mockRejectedValue(new Error('api-error'));
    ipcMock.createIpcSender.mockReturnValue(sender);
    await expect(httpPost(node, 'getinfo')).rejects.toThrow('api-error');
  });

  it('should perform a successful httpPost', async () => {
    const sender = jest.fn().mockResolvedValue('asdf');
    ipcMock.createIpcSender.mockReturnValue(sender);
    await expect(httpPost(node, 'getinfo')).resolves.toBe('asdf');
    expect(sender).toBeCalledWith(
      'http',
      expect.objectContaining({
        url: 'http://127.0.0.1:8283/getinfo',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic OmVjbGFpcnB3',
        },
      }),
    );
  });
});
