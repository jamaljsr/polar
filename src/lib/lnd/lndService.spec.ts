import { getNetwork } from 'utils/tests';
import lndProxyClient from './lndProxyClient';
import lndService from './lndService';

jest.mock('./lndProxyClient');

describe('LndService', () => {
  const [node, node2] = getNetwork().nodes.lightning;

  it('should get node info', async () => {
    const expected = { identityPubkey: 'asdf' };
    lndProxyClient.getInfo = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const expected = { confirmedBalance: '1000' };
    lndProxyClient.getWalletBalance = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.getWalletBalance(node);
    expect(actual).toEqual(expected);
  });

  it('should get new address', async () => {
    const expected = { address: 'abcdef' };
    lndProxyClient.getNewAddress = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.getNewAddress(node);
    expect(actual).toEqual(expected);
  });

  it('should get list channels', async () => {
    const expected = { channels: [] };
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.listChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should get list pending channels', async () => {
    const expected = { pendingOpenChannels: [] };
    lndProxyClient.pendingChannels = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.pendingChannels(node);
    expect(actual).toEqual(expected);
  });

  describe('openChannel', () => {
    it('should open the channel successfully', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({ identityPubkey: 'asdf' });
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'asdf' }],
      });
      const expected = { fundingTxidStr: 'xyz' };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(expected);
      const actual = await lndService.openChannel(node, node2, '1000');
      expect(actual).toEqual(expected);
      expect(lndProxyClient.getInfo).toBeCalledTimes(1);
      expect(lndProxyClient.listPeers).toBeCalledTimes(1);
      expect(lndProxyClient.connectPeer).toBeCalledTimes(0);
    });

    it('should connect peer then open the channel', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({ identityPubkey: 'asdf' });
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'fdsa' }],
      });
      const expected = { fundingTxidStr: 'xyz' };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(expected);
      const actual = await lndService.openChannel(node, node2, '1000');
      expect(actual).toEqual(expected);
      expect(lndProxyClient.getInfo).toBeCalledTimes(1);
      expect(lndProxyClient.listPeers).toBeCalledTimes(1);
      expect(lndProxyClient.connectPeer).toBeCalledTimes(1);
    });
  });

  describe('waitUntilOnline', () => {
    it('should return true when successful', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      const result = await lndService.waitUntilOnline(node);
      expect(result).toBe(true);
      expect(lndProxyClient.getInfo).toBeCalledTimes(1);
    });

    it('should return false on failure', async () => {
      lndProxyClient.getInfo = jest.fn().mockRejectedValue(new Error());
      const result = await lndService.waitUntilOnline(node, 0.5, 1);
      expect(result).toBe(false);
      expect(lndProxyClient.getInfo).toBeCalledTimes(5);
    });
  });
});
