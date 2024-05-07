export interface Session {
  id: string;
  label: string;
  pairingPhrase: string;
  mailboxServerAddr: string;
  state: 'Created' | 'In Use' | 'Revoked' | 'Expired';
  type: 'Read Only' | 'Admin' | 'Custom' | 'UI Password' | 'Autopilot' | 'Account';
  accountId: string;
  localPublicKey: string;
  remotePublicKey: string;
  createdAt: number;
  expiresAt: number;
}
