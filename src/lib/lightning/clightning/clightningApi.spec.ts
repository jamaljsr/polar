import fs from 'fs-extra';
import { CLightningNode } from 'shared/types';
import * as utils from 'shared/utils';
import { io } from 'socket.io-client';
import { getNetwork } from 'utils/tests';
import { clearListeners, getListener, httpPost, removeListener } from './clightningApi';

jest.mock('fs-extra');
jest.mock('shared/utils');
jest.mock('socket.io-client');

const fsMock = fs as jest.Mocked<typeof fs>;
const utilsMock = utils as jest.Mocked<typeof utils>;
const ioMock = io as unknown as jest.Mock<typeof io>;

describe('CLightningApi', () => {
  const node = getNetwork().nodes.lightning[1] as CLightningNode;

  beforeEach(() => {
    fsMock.readFile.mockResolvedValue(Buffer.from('rune-content'));
    ioMock.mockImplementation(() => {
      return {
        on: jest.fn(),
        disconnect: jest.fn(),
      } as any;
    });
    clearListeners();
  });

  it('should perform a successful httpPost', async () => {
    let url = '';
    let options: utils.HttpRequestOptions = {};
    utilsMock.httpRequest.mockImplementation((u, o) => {
      url = u;
      options = o as utils.HttpRequestOptions;
      return Promise.resolve('{ "success": true }');
    });

    const res = await httpPost(node, 'post-ok', { data: 'asdf' });
    expect(res).toEqual({ success: true });
    expect(url).toEqual(`http://127.0.0.1:${node.ports.rest}/v1/post-ok`);
    expect(options).toEqual({
      body: '{"data":"asdf"}',
      headers: {
        'Content-Type': 'application/json',
        rune: 'rune-content',
      },
      method: 'POST',
    });
  });

  it('should perform an httpPost without a body', async () => {
    let url = '';
    let options: utils.HttpRequestOptions = {};
    utilsMock.httpRequest.mockImplementation((u, o) => {
      url = u;
      options = o as utils.HttpRequestOptions;
      return Promise.resolve('{ "success": true }');
    });

    const res = await httpPost(node, 'post-ok');
    expect(res).toEqual({ success: true });
    expect(url).toEqual(`http://127.0.0.1:${node.ports.rest}/v1/post-ok`);
    expect(options).toEqual({
      headers: {
        'Content-Type': 'application/json',
        rune: 'rune-content',
      },
      method: 'POST',
    });
  });

  it('should throw an error for an error response', async () => {
    utilsMock.httpRequest.mockResolvedValue('{ "code": 123, "message": "error" }');
    await expect(httpPost(node, 'post-bad')).rejects.toThrow('lightningd 123: error');
  });

  it('should throw an error for an incorrect node implementation', async () => {
    const lnd = getNetwork().nodes.lightning[0];
    await expect(httpPost(lnd, 'get-ok')).rejects.toThrow(
      "ClightningService cannot be used for 'LND' nodes",
    );
  });

  it('should get a listener for the provided node', async () => {
    const listener = await getListener(node);
    expect(listener).not.toBe(null);
    expect(listener.on).not.toBe(null);

    const listener2 = await getListener(node);
    expect(listener2).not.toBe(null);
    expect(listener2).toBe(listener);

    expect(ioMock).toHaveBeenCalled();
  });

  it('should remove a listener for the provided LightningNode', async () => {
    ioMock.mockImplementationOnce(() => ({ disconnect: jest.fn() } as any));

    // make sure the listener is cached
    const listener = await getListener(node);
    expect(listener).not.toBe(null);

    removeListener(node);
    expect(listener.disconnect).toHaveBeenCalled();

    // it should return a different listener for the same node after removing it
    const listener2 = await getListener(node);
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
