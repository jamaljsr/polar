export interface LdkChannel {
  channel_id: string;
  counterparty_node_id: string;
  funding_txo?: {
    txid: string;
    vout: number;
  };
  user_channel_id: string;
  channel_value_sats: string;
  outbound_capacity_msat: string;
  inbound_capacity_msat: string;
  is_outbound: boolean;
  is_channel_ready: boolean;
  is_usable: boolean;
  is_announced: boolean;
  confirmations?: number;
  confirmations_required?: number;
}

export interface LdkPeer {
  node_id: string;
  address: string;
  is_persisted: boolean;
  is_connected: boolean;
}

export interface LdkNodeInfo {
  node_id: string;
  node_alias?: string;
  node_uris: string[];
  current_best_block?: {
    height: number;
  };
  listening_addresses: string[];
}

export interface LdkBalances {
  total_onchain_balance_sats: string;
  spendable_onchain_balance_sats: string;
  total_lightning_balance_sats: string;
}

export interface LdkPayment {
  id: string;
  amount_msat?: string;
  status: string;
  direction: string;
  kind?: {
    bolt11?: {
      hash: string;
      preimage?: string;
    };
  };
}
