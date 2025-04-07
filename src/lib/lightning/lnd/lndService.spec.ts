import { debug } from 'electron-log';
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

jest.mock('electron-log');
jest.mock('./lndProxyClient');

// encoded channel assets data
const customChannelData = Buffer.from(
  '7b22617373657473223a5b7b2261737365745f7574786f223a7b2276657273696f6e223a312c2261737365745f67656e65736973223a7b2267656e657369735f706f696e74223a22363034343536646133663938326662613336373065383233353238393536386566363830356366316366303064666662643732623863333539326132363338373a31222c226e616d65223a22414141222c226d6574615f68617368223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c2261737365745f6964223a2238623436663166663763383363613432623862306131396139396130666363636633636662376631613833646561333061356664643535323030323235376461227d2c22616d6f756e74223a3530302c227363726970745f6b6579223a22303235306161656231363666343233343635306438346132643861313330393837616561663639353032303665303930353430316565373466663366386431386536227d2c226361706163697479223a3530302c226c6f63616c5f62616c616e6365223a3330302c2272656d6f74655f62616c616e6365223a3230307d5d7d',
  'hex',
);
const emptyCustomChannelData = Buffer.from(JSON.stringify({}), 'utf-8');

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
      channels: [
        defaultLndChannel({
          remotePubkey: 'xyz',
          initiator: true,
          customChannelData: Buffer.from('random data'),
        }),
      ],
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
      numSatoshis: '10000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice', 10000);
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(10000);
    expect(actual.destination).toEqual('asdf');
  });

  it('should pay invoice with amount for a payreq without one', async () => {
    const payResponse = { paymentPreimage: 'preimage' };
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '0',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice', 10000);
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(0);
    expect(actual.destination).toEqual('asdf');
    expect(lndProxyClient.payInvoice).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ amt: '10000' }),
    );
  });

  it('should throw an error if paying the invoice fails', async () => {
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '1000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockRejectedValue(new Error('pay-err'));
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    await expect(lndService.payInvoice(node, 'lnbc1invoice')).rejects.toThrow('pay-err');
  });

  it('should decode an invoice', async () => {
    const decodeResponse = {
      paymentHash: '129aff5e8f8de157a34ab3b36f1ed745f31998e4f9e709f3d32f6ebde78c7c10',
      expiry: '86400',
      numMsat: '2500000',
    };
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.decodeInvoice(node, 'lnbc1invoice');
    expect(actual.paymentHash).toEqual(decodeResponse.paymentHash);
    expect(actual.amountMsat).toEqual(decodeResponse.numMsat);
    expect(actual.expiry).toEqual(decodeResponse.expiry);
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

  it('should subscribe Channel Events', async () => {
    const mockCallback = jest.fn();
    const pendingChannelEvent = { pendingOpenChannel: { txid: 'txid' } };
    const openChannelEvent = { activeChannel: { fundingTxidBytes: 'txid' } };
    const inActiveChannelEvent = { inactiveChannel: { fundingTxidBytes: 'txid' } };
    const closedChannelEvent = { closedChannel: { closingTxHash: 'txhash' } };
    const unknownChannelEvent = { unknownChannel: { txid: 'txid' } };

    lndProxyClient.subscribeChannelEvents = jest.fn().mockImplementation((_, cb) => {
      cb(pendingChannelEvent);
      cb(openChannelEvent);
      cb(inActiveChannelEvent);
      cb(closedChannelEvent);
      cb(unknownChannelEvent);
    });

    await lndService.subscribeChannelEvents(node, mockCallback);

    expect(lndProxyClient.subscribeChannelEvents).toHaveBeenCalledWith(
      node,
      expect.any(Function),
    );

    expect(mockCallback).toHaveBeenCalledWith({ type: 'Pending' });
    expect(mockCallback).toHaveBeenCalledWith({ type: 'Open' });
    expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });
  });

  it('addListenerToNode should call debug with node port', async () => {
    await lndService.addListenerToNode(node);
    expect(debug).toHaveBeenCalledWith(
      'addListenerToNode LndNode on port: ',
      node.ports.rest,
    );
  });

  it('removeListener should call debug with node port', async () => {
    await lndService.removeListener(node);
    expect(debug).toHaveBeenCalledWith(
      'LndService: removeListener',
      node.name,
      node.ports.rest,
    );
  });

  describe('asset payments', () => {
    const channels = defaultLndListChannels({
      channels: [
        defaultLndChannel({
          chanId: '1234',
          remotePubkey: 'nodeId',
          customChannelData,
        }),
        defaultLndChannel({
          chanId: '5678',
          remotePubkey: 'nodeId',
          customChannelData: emptyCustomChannelData,
        }),
      ],
    });

    const chanInfo = {
      node1Pub: 'nodeId',
      node2Pub: '0370bd9ea40f2fb4e9d0f8051cdacc4b3ded33723e92214afbffaeb390b4a3fda0',
      node1Policy: {
        feeBaseMsat: '1000',
        feeRateMilliMsat: '1',
      },
      node2Policy: {
        feeBaseMsat: '1000',
        feeRateMilliMsat: '1',
      },
    };

    const assetInfo = {
      nodeId: 'nodeId',
      scid: 'scid',
      msats: '1000000',
    };

    beforeEach(() => {
      lndProxyClient.listChannels = jest.fn().mockResolvedValue(channels);
      lndProxyClient.getChanInfo = jest.fn().mockResolvedValue(chanInfo);
    });

    it('should create an invoice with asset info', async () => {
      const expected = 'lnbc1invoice';
      const mocked = { paymentRequest: expected };
      lndProxyClient.createInvoice = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.createInvoice(node, 1000, undefined, assetInfo);
      expect(actual).toEqual(expected);
    });

    it('should throw an error if no assets are in a channel', async () => {
      lndProxyClient.listChannels = jest
        .fn()
        .mockResolvedValue(defaultLndListChannels({}));

      await expect(
        lndService.createInvoice(node, 1000, undefined, assetInfo),
      ).rejects.toThrow('No asset channel found with peer nodeId');
    });

    it('should throw an error if no channel info is found', async () => {
      lndProxyClient.getChanInfo = jest.fn().mockResolvedValue(undefined);

      await expect(
        lndService.createInvoice(node, 1000, undefined, assetInfo),
      ).rejects.toThrow('No channel info found for channel 1234');
    });

    it('should throw an error if no channel policy is found', async () => {
      lndProxyClient.getChanInfo = jest.fn().mockResolvedValue({
        node1Pub: '0370bd9ea40f2fb4e9d0f8051cdacc4b3ded33723e92214afbffaeb390b4a3fda0',
        node2Pub: 'nodeId',
      });

      await expect(
        lndService.createInvoice(node, 1000, undefined, assetInfo),
      ).rejects.toThrow('No channel policy found for channel 1234');
    });
  });
});
