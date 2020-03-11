export interface GetInfoResponse {
  version: string;
  nodeId: string;
  alias: string;
  color: string;
  features: string;
  chainHash: string;
  blockHeight: number;
  publicAddresses: string[];
}
