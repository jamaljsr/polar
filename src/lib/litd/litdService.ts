import * as LITD from '@lightningpolar/litd-api';
import { LitdNode } from 'shared/types';
import { LitdLibrary } from 'types';
import { litdProxyClient as proxy } from './';
import * as PLIT from './types';

class LitdService implements LitdLibrary {
  async status(node: LitdNode): Promise<LITD.SubServerStatusResp> {
    return await proxy.status(node);
  }

  async listSessions(node: LitdNode): Promise<PLIT.Session[]> {
    const { sessions } = await proxy.listSessions(node);
    return sessions.map(s => this.mapSession(s));
  }

  async addSession(
    node: LitdNode,
    label: string,
    type: PLIT.Session['type'],
    expiresAt: number,
    mailboxServerAddr?: string,
  ): Promise<PLIT.Session> {
    const req: LITD.AddSessionRequestPartial = {
      label,
      sessionType:
        type === 'Admin'
          ? LITD.SessionType.TYPE_MACAROON_ADMIN
          : LITD.SessionType.TYPE_MACAROON_READONLY,
      expiryTimestampSeconds: Math.floor(expiresAt / 1000),
      mailboxServerAddr,
      devServer: true,
    };
    const { session } = await proxy.addSession(node, req);
    return this.mapSession(session as LITD.Session);
  }

  async revokeSession(node: LitdNode, localPublicKey: string): Promise<void> {
    const req: LITD.RevokeSessionRequest = {
      localPublicKey: Buffer.from(localPublicKey, 'hex'),
    };
    await proxy.revokeSession(node, req);
  }

  private mapSession(session: LITD.Session): PLIT.Session {
    return {
      id: session.id.toString(),
      label: session.label,
      pairingPhrase: session.pairingSecretMnemonic,
      mailboxServerAddr: session.mailboxServerAddr,
      state: this.mapSessionState(session.sessionState),
      type: this.mapSessionType(session.sessionType),
      accountId: session.accountId,
      localPublicKey: session.localPublicKey.toString(),
      remotePublicKey: session.remotePublicKey.toString(),
      createdAt: parseInt(session.createdAt) * 1000,
      expiresAt: parseInt(session.expiryTimestampSeconds) * 1000,
    };
  }

  private mapSessionState(state: LITD.SessionState): PLIT.Session['state'] {
    switch (state) {
      case LITD.SessionState.STATE_CREATED:
        return 'Created';
      case LITD.SessionState.STATE_IN_USE:
        return 'In Use';
      case LITD.SessionState.STATE_REVOKED:
        return 'Revoked';
      case LITD.SessionState.STATE_EXPIRED:
        return 'Expired';
    }
  }

  private mapSessionType(type: LITD.SessionType): PLIT.Session['type'] {
    switch (type) {
      case LITD.SessionType.TYPE_MACAROON_READONLY:
        return 'Read Only';
      case LITD.SessionType.TYPE_MACAROON_ADMIN:
        return 'Admin';
      case LITD.SessionType.TYPE_MACAROON_CUSTOM:
        return 'Custom';
      case LITD.SessionType.TYPE_UI_PASSWORD:
        return 'UI Password';
      case LITD.SessionType.TYPE_AUTOPILOT:
        return 'Autopilot';
      case LITD.SessionType.TYPE_MACAROON_ACCOUNT:
        return 'Account';
    }
  }
}

export default new LitdService();
