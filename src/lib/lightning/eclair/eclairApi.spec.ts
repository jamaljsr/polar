import { EclairNode } from 'shared/types';
import WebSocket from 'ws';
import * as ipc from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import {
  clearListeners,
  getListener,
  httpPost,
  removeListener,
  setupListener,
} from './eclairApi';

jest.mock('ws');
jest.mock('lib/ipc/ipcService');

const ipcMock = ipc as jest.Mocked<typeof ipc>;
const webSocketMock = WebSocket as unknown as jest.Mock<typeof WebSocket>;

describe('EclairApi', () => {
  const node = getNetwork().nodes.lightning[2] as EclairNode;

  beforeEach(() => {
    webSocketMock.mockImplementation(
      () =>
        ({
          ping: jest.fn(),
          close: jest.fn(),
          readyState: WebSocket.OPEN,
        } as any),
    );

    clearListeners();
  });

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
    const listener = getListener(node);
    expect(listener).not.toBe(null);
    expect(listener.on).not.toBe(null);

    const listener2 = getListener(node);
    expect(listener2).not.toBe(null);
    expect(listener2).toBe(listener);

    expect(webSocketMock).toHaveBeenCalled();
  });

  it('should setup a listener for the provided EclairNode', () => {
    jest.useFakeTimers();

    const pingMock = jest.fn();
    webSocketMock.mockImplementationOnce(
      () =>
        ({
          ping: pingMock,
          close: jest.fn(),
          readyState: WebSocket.OPEN,
        } as any),
    );

    const listener = setupListener(node);
    expect(listener).not.toBe(null);
    expect(listener.on).not.toBe(null);

    // Fast-forward time to trigger the interval
    jest.advanceTimersByTime(50e3);

    // Verify ping is called within the interval
    expect(pingMock).toHaveBeenCalled();
  });

  it('should should not send ping on a closed socket', () => {
    jest.useFakeTimers();

    const pingMock = jest.fn();
    webSocketMock.mockImplementationOnce(
      () =>
        ({
          ping: pingMock,
          close: jest.fn(),
          readyState: WebSocket.CLOSED,
        } as any),
    );

    const listener = setupListener(node);
    expect(listener).not.toBe(null);
    expect(listener.on).not.toBe(null);

    // Fast-forward time to trigger the interval
    jest.advanceTimersByTime(50e3);

    // Verify ping is not called within the interval
    expect(pingMock).not.toHaveBeenCalled();
  });

  it('should remove a listener for the provided LightningNode', () => {
    webSocketMock.mockImplementationOnce(() => ({ close: jest.fn() } as any));

    // make sure the listener is cached
    const listener = getListener(node);
    expect(listener).not.toBe(null);

    removeListener(node);

    // it should return a different listener for the same node after removing it
    const listener2 = getListener(node);
    expect(listener2).not.toBe(null);
    expect(listener2).not.toBe(listener);
  });

  it('should do nothing when removing a listener that does not exist', () => {
    // Use a different port to ensure the listener isn't cached
    const otherNode = {
      ...node,
      ports: { ...node.ports, rest: 1234 },
    };
    // removing a listener that doesn't exist should not throw
    expect(() => removeListener(otherNode)).not.toThrow();
  });
});
