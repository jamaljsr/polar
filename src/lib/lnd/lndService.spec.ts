import {
  defaultChannel,
  defaultInfo,
  defaultListChannels,
  defaultPendingChannel,
  defaultPendingChannels,
  defaultPendingOpenChannel,
  defaultWalletBalance,
} from 'shared';
import { groupNodes } from 'utils/network';
import { defaultStateBalances, defaultStateInfo, getNetwork } from 'utils/tests';
import lndProxyClient from './lndProxyClient';
import lndService from './lndService';

jest.mock('./lndProxyClient');

describe('LndService', () => {
  const [node, node2] = groupNodes(getNetwork()).lnd;

  it('should get node info', async () => {
    const apiResponse = defaultInfo({ identityPubkey: 'asdf' });
    const expected = defaultStateInfo({ pubkey: 'asdf' });
    lndProxyClient.getInfo = jest.fn().mockResolvedValue(apiResponse);
    const actual = await lndService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const apiResponse = defaultWalletBalance({ confirmedBalance: '1000' });
    const expected = defaultStateBalances({ confirmed: '1000' });
    lndProxyClient.getWalletBalance = jest.fn().mockResolvedValue(apiResponse);
    const actual = await lndService.getBalances(node);
    expect(actual).toEqual(expected);
  });

  it('should get new address', async () => {
    const expected = { address: 'abcdef' };
    lndProxyClient.getNewAddress = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.getNewAddress(node);
    expect(actual).toEqual(expected);
  });

  it('should get list channels', async () => {
    const mocked = defaultListChannels({
      channels: [defaultChannel({ remotePubkey: 'xyz', initiator: true })],
    });
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(mocked);
    lndProxyClient.pendingChannels = jest
      .fn()
      .mockResolvedValue(defaultPendingChannels({}));
    const actual = await lndService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should get list pending channels', async () => {
    const mocked = defaultPendingChannels({
      pendingOpenChannels: [
        defaultPendingOpenChannel({
          channel: defaultPendingChannel({ remoteNodePub: 'xyz' }),
        }),
      ],
    });
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(defaultListChannels({}));
    lndProxyClient.pendingChannels = jest.fn().mockResolvedValue(mocked);
    const actual = await lndService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should close the channel', async () => {
    const expected = true;
    lndProxyClient.closeChannel = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.closeChannel(node, 'chanPoint');
    expect(actual).toEqual(expected);
  });

  describe('openChannel', () => {
    it('should open the channel successfully', async () => {
      lndProxyClient.getInfo = jest
        .fn()
        .mockResolvedValue(defaultInfo({ identityPubkey: 'asdf' }));
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'asdf' }],
      });
      const expected = { txid: 'xyz', index: 0 };
      const mocked = { fundingTxidStr: 'xyz', outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel(node, node2, '1000');
      expect(actual).toEqual(expected);
      expect(lndProxyClient.getInfo).toBeCalledTimes(1);
      expect(lndProxyClient.listPeers).toBeCalledTimes(1);
      expect(lndProxyClient.connectPeer).toBeCalledTimes(0);
    });

    it('should connect peer then open the channel', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({ pubkey: 'asdf' });
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'fdsa' }],
      });
      const expected = { txid: 'xyz', index: 0 };
      const mocked = { fundingTxidStr: 'xyz', outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel(node, node2, '1000');
      expect(actual).toEqual(expected);
      expect(lndProxyClient.getInfo).toBeCalledTimes(1);
      expect(lndProxyClient.listPeers).toBeCalledTimes(1);
      expect(lndProxyClient.connectPeer).toBeCalledTimes(1);
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      await expect(lndService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(lndProxyClient.getInfo).toBeCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      lndProxyClient.getInfo = jest.fn().mockRejectedValue(new Error('test-error'));
      await expect(lndService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(lndProxyClient.getInfo).toBeCalledTimes(4);
    });
  });
});
