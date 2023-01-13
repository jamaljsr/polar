export default {
  // general app chnnels
  openWindow: 'open-window',
  clearCache: 'clear-cache',
  http: 'http',
  zip: 'zip',
  unzip: 'unzip',
  // LND proxy channels
  getInfo: 'get-info',
  walletBalance: 'wallet-balance',
  newAddress: 'new-address',
  listPeers: 'list-peers',
  connectPeer: 'connect-peer',
  openChannel: 'open-channel',
  closeChannel: 'close-channel',
  listChannels: 'list-channels',
  pendingChannels: 'pending-channels',
  createInvoice: 'create-invoice',
  payInvoice: 'pay-invoice',
  decodeInvoice: 'decode-invoice',
  // tarod proxy channels
  taro: {
    listAssets: 'taro-list-assets',
    listBalances: 'taro-list-balances',
    mintAsset: 'taro-mint-asset',
  },
};
