import { createHmac } from 'crypto';
import { join } from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { readFile } from 'fs-extra';
import { LdkServerNode } from '../../src/shared/types';

const PROTO_DIR = join(__dirname, 'proto');

const packageDefinition = protoLoader.loadSync(join(PROTO_DIR, 'api.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [PROTO_DIR],
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;
const LightningNodeClient = proto.api.LightningNode;

export const computeAuthHeader = (apiKey: string): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(timestamp));
  const hmac = createHmac('sha256', apiKey).update(buf).digest('hex');
  return `HMAC ${timestamp}:${hmac}`;
};

export const parseApiKey = (raw: Buffer): string => {
  if (raw.length === 32) {
    return raw.toString('hex');
  }
  return raw.toString('utf8').trim();
};

type RpcCallback = (error: grpc.ServiceError | null, response?: any) => void;

const promisify =
  <T>(fn: (req: any, metadata: grpc.Metadata, cb: RpcCallback) => void) =>
  (client: any, req: any, metadata: grpc.Metadata): Promise<T> =>
    new Promise((resolve, reject) => {
      fn.call(client, req, metadata, (err: grpc.ServiceError | null, res: T) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

class LdkGrpcClient {
  private cache: Record<string, any> = {};

  private async getClient(node: LdkServerNode) {
    const id = `n${node.networkId}-${node.name}`;
    if (!this.cache[id]) {
      const [cert, apiKeyRaw] = await Promise.all([
        readFile(node.paths.tlsCert),
        readFile(node.paths.apiKey),
      ]);
      const apiKey = parseApiKey(apiKeyRaw);
      const creds = grpc.credentials.createSsl(cert);
      const client = new LightningNodeClient(`127.0.0.1:${node.ports.grpc}`, creds);
      this.cache[id] = { client, apiKey };
    }
    return this.cache[id];
  }

  private async metadata(node: LdkServerNode) {
    const { apiKey } = await this.getClient(node);
    const metadata = new grpc.Metadata();
    metadata.set('x-auth', computeAuthHeader(apiKey));
    return metadata;
  }

  private async call<T>(node: LdkServerNode, method: string, req: any): Promise<T> {
    const { client } = await this.getClient(node);
    const metadata = await this.metadata(node);
    const fn = client[method];
    if (!fn) {
      throw new Error(`Unknown ldk-server RPC method: ${method}`);
    }
    return promisify<T>(fn)(client, req, metadata);
  }

  clearCache() {
    this.cache = {};
  }

  getInfo(node: LdkServerNode) {
    return this.call(node, 'GetNodeInfo', {});
  }

  getBalances(node: LdkServerNode) {
    return this.call(node, 'GetBalances', {});
  }

  onchainReceive(node: LdkServerNode) {
    return this.call(node, 'OnchainReceive', {});
  }

  listChannels(node: LdkServerNode) {
    return this.call(node, 'ListChannels', {});
  }

  listPeers(node: LdkServerNode) {
    return this.call(node, 'ListPeers', {});
  }

  connectPeer(node: LdkServerNode, req: any) {
    return this.call(node, 'ConnectPeer', req);
  }

  openChannel(node: LdkServerNode, req: any) {
    return this.call(node, 'OpenChannel', req);
  }

  closeChannel(node: LdkServerNode, req: any) {
    return this.call(node, 'CloseChannel', req);
  }

  bolt11Receive(node: LdkServerNode, req: any) {
    return this.call(node, 'Bolt11Receive', req);
  }

  bolt11Send(node: LdkServerNode, req: any) {
    return this.call(node, 'Bolt11Send', req);
  }

  decodeInvoice(node: LdkServerNode, req: any) {
    return this.call(node, 'DecodeInvoice', req);
  }

  getPaymentDetails(node: LdkServerNode, req: any) {
    return this.call(node, 'GetPaymentDetails', req);
  }

  subscribeEvents(node: LdkServerNode, onData: (data: any) => void): () => void {
    let stream: grpc.ClientReadableStream<any> | null = null;

    this.getClient(node).then(({ client, apiKey }) => {
      const metadata = new grpc.Metadata();
      metadata.set('x-auth', computeAuthHeader(apiKey));
      stream = client.SubscribeEvents({}, metadata);
      stream?.on('data', onData);
    });

    return () => {
      if (stream) {
        stream.cancel();
        stream = null;
      }
    };
  }
}

export default new LdkGrpcClient();
