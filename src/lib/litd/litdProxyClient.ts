import * as LITD from '@lightningpolar/litd-api';
import { ipcChannels } from 'shared';
import { LitdNode } from 'shared/types';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';

class LitdProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('LitdProxyClient', 'litd');
  }

  async status(node: LitdNode): Promise<LITD.SubServerStatusResp> {
    return await this.ipc(ipcChannels.litd.status, { node });
  }

  async listSessions(node: LitdNode): Promise<LITD.ListSessionsResponse> {
    return await this.ipc(ipcChannels.litd.listSessions, { node });
  }

  async addSession(
    node: LitdNode,
    req: LITD.AddSessionRequestPartial,
  ): Promise<LITD.AddSessionResponse> {
    return await this.ipc(ipcChannels.litd.addSession, { node, req });
  }

  async revokeSession(
    node: LitdNode,
    req: LITD.RevokeSessionRequest,
  ): Promise<LITD.RevokeSessionResponse> {
    return await this.ipc(ipcChannels.litd.revokeSession, { node, req });
  }
}

export default new LitdProxyClient();
