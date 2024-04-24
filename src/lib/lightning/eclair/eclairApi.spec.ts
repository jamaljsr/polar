import { EclairNode } from 'shared/types';
import * as ipc from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import { httpPost, setupListener, getListener } from './eclairApi';
import WebSocket from 'ws';

jest.mock('ws');
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

  it('should get a listener for the provided EclairNode', () => {
    const mockELN = { EclairWebSocket: jest.fn() };
    const webSocketMock = new mockELN.EclairWebSocket();
    jest.spyOn(window, 'WebSocket').mockReturnValue(webSocketMock);

    const listener = getListener(node);
    expect(listener).not.toBe(null);
    expect(listener.on).not.toBe(null);

    expect(mockELN.EclairWebSocket).toHaveBeenCalled();
  });

  it('should setup a listener for the provided EclairNode', () => {
    jest.useFakeTimers();

    const webSocketMock = jest
      .spyOn(WebSocket.prototype, 'ping')
      .mockImplementation(() => {
        return { ping: jest.fn() };
      });

    const listener = setupListener(node);
    expect(listener).not.toBe(null);
    expect(listener.on).not.toBe(null);

    // Fast-forward time to trigger the interval
    jest.advanceTimersByTime(50e3);

    // Verify ping is called within the interval
    expect(
      (webSocketMock.mock.instances[0] as unknown as WebSocket).ping,
    ).toHaveBeenCalled();
  });
});
