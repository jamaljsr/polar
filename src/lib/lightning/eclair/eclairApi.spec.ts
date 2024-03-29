import { EclairNode } from 'shared/types';
import * as ipc from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import { httpPost, setupListener } from './eclairApi';
import { EclairWebSocket } from 'eclair-ts/dist/types/network';
import EclairTs from 'eclair-ts';

jest.mock('lib/ipc/ipcService');
jest.mock('eclair-ts');

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

  it('should perform an successful httpPost with an error', async () => {
    const sender = jest.fn().mockResolvedValue({ error: 'api-error' });
    ipcMock.createIpcSender.mockReturnValue(sender);
    await expect(httpPost(node, 'getinfo')).rejects.toThrow('api-error');
  });

  it('should perform a successful httpPost', async () => {
    const sender = jest.fn().mockResolvedValue('asdf');
    ipcMock.createIpcSender.mockReturnValue(sender);
    await expect(httpPost(node, 'getinfo')).resolves.toBe('asdf');
    expect(sender).toHaveBeenCalledWith(
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

  it('should setup a listener for the provided EclairNode', () => {
    const mockListener = jest.fn() as unknown as EclairWebSocket;
    // Mock the EclairTs constructor to return a mock instance
    const EclairTsMock = jest.fn().mockImplementation(() => ({
      listen: jest.fn().mockReturnValue(mockListener),
    }));
    (EclairTs as unknown as jest.Mock).mockImplementation(EclairTsMock);
    const listener = setupListener(node);
    expect(listener).toBe(mockListener);
  });
});
