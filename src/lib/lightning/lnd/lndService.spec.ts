import {
  defaultLndChannel,
  defaultLndInfo,
  defaultLndListChannels,
  defaultLndPendingChannel,
  defaultLndPendingChannels,
  defaultLndPendingOpenChannel,
  defaultLndWalletBalance,
} from 'shared';
import { defaultStateBalances, defaultStateInfo, getNetwork } from 'utils/tests';
import lndProxyClient from './lndProxyClient';
import lndService from './lndService';

jest.mock('./lndProxyClient');

describe('LndService', () => {
  const node = getNetwork().nodes.lightning[0];

  it('should get node info', async () => {
    const apiResponse = defaultLndInfo({ identityPubkey: 'asdf' });
    const expected = defaultStateInfo({ pubkey: 'asdf' });
    lndProxyClient.getInfo = jest.fn().mockResolvedValue(apiResponse);
    const actual = await lndService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const apiResponse = defaultLndWalletBalance({ confirmedBalance: '1000' });
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

  it('should get list of channels', async () => {
    const mocked = defaultLndListChannels({
      channels: [defaultLndChannel({ remotePubkey: 'xyz', initiator: true })],
    });
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(mocked);
    lndProxyClient.pendingChannels = jest
      .fn()
      .mockResolvedValue(defaultLndPendingChannels({}));
    const actual = await lndService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should get list of pending channels', async () => {
    const mocked = defaultLndPendingChannels({
      pendingOpenChannels: [
        defaultLndPendingOpenChannel({
          channel: defaultLndPendingChannel({ remoteNodePub: 'xyz' }),
        }),
      ],
    });
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(defaultLndListChannels({}));
    lndProxyClient.pendingChannels = jest.fn().mockResolvedValue(mocked);
    const actual = await lndService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should not throw error when connecting to peers', async () => {
    lndProxyClient.listPeers = jest.fn().mockResolvedValue({
      peers: [{ pubKey: 'fdsa' }],
    });
    lndProxyClient.connectPeer = jest.fn().mockRejectedValue(new Error('peer-error'));
    await expect(lndService.connectPeers(node, ['asdf'])).resolves.not.toThrow();
  });

  it('should close the channel', async () => {
    const expected = true;
    lndProxyClient.closeChannel = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.closeChannel(node, 'chanPoint');
    expect(actual).toEqual(expected);
  });

  it('should create an invoice', async () => {
    const expected = 'lnbc1invoice';
    const mocked = { paymentRequest: expected };
    lndProxyClient.createInvoice = jest.fn().mockResolvedValue(mocked);
    const actual = await lndService.createInvoice(node, 1000);
    expect(actual).toEqual(expected);
  });

  it('should pay an invoice', async () => {
    const payResponse = { paymentPreimage: 'preimage' };
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '1000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice');
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(1000);
    expect(actual.destination).toEqual('asdf');
  });

  it('should pay an invoice with an amount', async () => {
    const payResponse = { paymentPreimage: 'preimage' };
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '1000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice', 1000);
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(1000);
    expect(actual.destination).toEqual('asdf');
  });

  it('should throw an error if paying the invoice fails', async () => {
    const payResponse = { paymentError: 'pay-err' };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    await expect(lndService.payInvoice(node, 'lnbc1invoice')).rejects.toThrow('pay-err');
  });

  it('should throw an error for an incorrect node', async () => {
    const cln = getNetwork().nodes.lightning[1];
    await expect(lndService.getInfo(cln)).rejects.toThrow(
      "LndService cannot be used for 'c-lightning' nodes",
    );
  });

  describe('openChannel', () => {
    it('should open the channel successfully', async () => {
      lndProxyClient.getInfo = jest
        .fn()
        .mockResolvedValue(defaultLndInfo({ identityPubkey: 'asdf' }));
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'asdf' }],
      });
      const expected = { txid: 'xyz', index: 0 };
      const mocked = { fundingTxidStr: 'xyz', outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
      expect(lndProxyClient.listPeers).toHaveBeenCalledTimes(1);
      expect(lndProxyClient.connectPeer).toHaveBeenCalledTimes(0);
    });

    it('should connect peer then open the channel', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({ pubkey: 'asdf' });
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'fdsa' }],
      });
      const expected = { txid: 'xyz', index: 0 };
      const mocked = { fundingTxidStr: 'xyz', outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
      expect(lndProxyClient.listPeers).toHaveBeenCalledTimes(1);
      expect(lndProxyClient.connectPeer).toHaveBeenCalledTimes(1);
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      await expect(lndService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(lndProxyClient.getInfo).toHaveBeenCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      lndProxyClient.getInfo = jest.fn().mockRejectedValue(new Error('test-error'));
      await expect(lndService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(lndProxyClient.getInfo).toHaveBeenCalledTimes(4);
    });
  });

  it('should add listener to node', async () => {
    lndProxyClient.setupListener = jest.fn();
    await lndService.addListenerToNode(node);
    expect(lndProxyClient.setupListener).toHaveBeenCalledWith(node);
    expect(lndProxyClient.setupListener).toHaveBeenCalledTimes(1);
  });

  it('should remove Listener from node', async () => {
    lndProxyClient.removeListener = jest.fn();
    await lndService.removeListener(node);
    expect(lndProxyClient.removeListener).toHaveBeenCalledWith(node);
    expect(lndProxyClient.removeListener).toHaveBeenCalledTimes(1);
  });

  it('should subscribe Channel Events', async () => {
    const callback = jest.fn();
    lndProxyClient.subscribeChannelEvents = jest.fn();
    await lndService.subscribeChannelEvents(node, callback);
    expect(lndProxyClient.subscribeChannelEvents).toHaveBeenCalledWith(node, callback);
    expect(lndProxyClient.subscribeChannelEvents).toHaveBeenCalledTimes(1);
  });
});
