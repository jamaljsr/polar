import {
  BitcoinNode,
  CLightningNode,
  CommonNode,
  EclairNode,
  LitdNode,
  LndNode,
  TapdNode,
} from 'shared/types';
import {
  bitcoinCredentials,
  btcdCredentials,
  dockerConfigs,
  eclairCredentials,
  litdCredentials,
} from 'utils/constants';
import { getContainerName, getDefaultCommand } from 'utils/network';
import { isWindows } from 'utils/system';
import {
  bitcoind,
  btcd,
  btcwallet,
  clightning,
  eclair,
  litd,
  lnd,
  simln,
  tapd,
} from './nodeTemplates';

export interface ComposeService {
  image: string;
  container_name: string;
  environment?: Record<string, string>;
  hostname: string;
  command: string;
  volumes: string[];
  expose: string[];
  ports: string[];
  restart?: 'always';
  stop_grace_period?: string;
}

export interface ComposeContent {
  name: string;
  services: {
    [key: string]: ComposeService;
  };
  volumes?: {
    [key: string]: { name: string } | null;
  };
}

class ComposeFile {
  content: ComposeContent;

  constructor(id: number) {
    this.content = {
      name: `polar-network-${id}`,
      services: {},
    };
  }

  addService(service: ComposeService) {
    this.content.services[service.hostname] = {
      environment: {
        USERID: '${USERID:-1000}',
        GROUPID: '${GROUPID:-1000}',
        ...service.environment,
      },
      stop_grace_period: '30s',
      ...service,
    };
  }

  addBitcoind(node: BitcoinNode) {
    const { name, version, ports } = node;
    const { rpc, p2p, zmqBlock, zmqTx } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      rpcUser: bitcoinCredentials.user,
      rpcAuth: bitcoinCredentials.rpcauth,
    };
    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.bitcoind.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('bitcoind', version);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const svc = bitcoind(name, container, image, rpc, p2p, zmqBlock, zmqTx, command);
    this.addService(svc);
  }

  addLnd(node: LndNode, backend: BitcoinNode) {
    const { name, version, ports } = node;
    const { rest, grpc, p2p } = ports;
    const container = getContainerName(node);
    const isBtcdBackend = backend.implementation === 'btcd';

    // use appropriate credentials based on backend type
    const credentials = isBtcdBackend ? btcdCredentials : bitcoinCredentials;

    // define the variable substitutions
    // for btcd, use the service hostname (backend.name) rather than the container name so
    // that LND's TLS ServerName matches the DNS SAN in btcd's auto-generated certificate
    const variables = {
      name: node.name,
      containerName: container,
      backendName: isBtcdBackend ? backend.name : getContainerName(backend),
      rpcUser: credentials.user,
      rpcPass: credentials.pass,
    };

    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.LND.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand =
      node.docker.command ||
      getDefaultCommand('LND', version, isBtcdBackend ? 'btcd' : undefined);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const btcdBackendName = isBtcdBackend ? backend.name : undefined;
    const svc = lnd(
      name,
      container,
      image,
      rest,
      grpc,
      p2p,
      command,
      isBtcdBackend,
      btcdBackendName,
    );
    this.addService(svc);
  }

  addClightning(node: CLightningNode, backend: CommonNode) {
    const { name, version, ports } = node;
    const { rest, p2p, grpc } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      backendName: getContainerName(backend),
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };
    // use the node's custom image or the default for the implementation
    const image =
      node.docker.image || `${dockerConfigs['c-lightning'].imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    let nodeCommand = node.docker.command || getDefaultCommand('c-lightning', version);
    // do not include the GRPC port arg in the command for unsupported versions
    if (grpc === 0) nodeCommand = nodeCommand.replace('--grpc-port=11001', '');
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // On Windows, use a named Docker volume for CLN's data directory instead of a bind mount.
    let namedVolumeName: string | undefined;
    if (isWindows()) {
      namedVolumeName = container;
      // register the named volume in the top-level volumes declaration
      if (!this.content.volumes) {
        this.content.volumes = {};
      }
      this.content.volumes[namedVolumeName] = null;
    }
    // add the docker service
    const svc = clightning(
      name,
      container,
      image,
      rest,
      grpc,
      p2p,
      command,
      namedVolumeName,
    );
    this.addService(svc);
  }

  addEclair(node: EclairNode, backend: CommonNode) {
    const { name, version, ports } = node;
    const { rest, p2p } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      backendName: getContainerName(backend),
      eclairPass: eclairCredentials.pass,
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };
    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.eclair.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('eclair', version);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const svc = eclair(name, container, image, rest, p2p, command);
    this.addService(svc);
  }

  addLitd(node: LitdNode, backend: BitcoinNode, proofCourier: CommonNode) {
    const { name, version, ports } = node;
    const { rest, grpc, p2p, web } = ports;
    const container = getContainerName(node);
    const isBtcdBackend = backend.implementation === 'btcd';

    // use appropriate credentials based on backend type
    const credentials = isBtcdBackend ? btcdCredentials : bitcoinCredentials;

    // define the variable substitutions
    // for btcd, use the service hostname (backend.name) rather than the container name so
    // that litd's TLS ServerName matches the DNS SAN in btcd's auto-generated certificate
    const variables = {
      name: node.name,
      containerName: container,
      backendName: isBtcdBackend ? backend.name : getContainerName(backend),
      rpcUser: credentials.user,
      rpcPass: credentials.pass,
      litdPass: litdCredentials.pass,
      proofCourier: getContainerName(proofCourier),
    };

    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.litd.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand =
      node.docker.command ||
      getDefaultCommand('litd', version, isBtcdBackend ? 'btcd' : undefined);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const btcdBackendName = isBtcdBackend ? backend.name : undefined;
    const svc = litd(
      name,
      container,
      image,
      rest,
      grpc,
      p2p,
      web,
      command,
      isBtcdBackend,
      btcdBackendName,
    );
    this.addService(svc);
  }

  addTapd(node: TapdNode, lndBackend: LndNode) {
    const { name, version, ports } = node;
    const { rest, grpc } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      containerName: container,
      lndName: getContainerName(lndBackend),
    };
    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.tapd.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('tapd', version);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const svc = tapd(name, container, image, rest, grpc, lndBackend.name, command);
    this.addService(svc);
  }

  addSimln(networkId: number) {
    const { name, imageName, command, env } = dockerConfigs.simln;
    const containerName = `polar-n${networkId}-simln`;
    const svc = simln(name, containerName, imageName, command, { ...env });
    this.addService(svc);
  }

  addBtcd(node: BitcoinNode) {
    const { name, version, ports } = node;
    const { rpc, p2p } = ports;
    const container = getContainerName(node);

    // define the variable substitutions
    const variables = {
      name,
      rpcUser: btcdCredentials.user,
      rpcPass: btcdCredentials.pass,
    };

    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.btcd.imageName}:${version}`;

    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('btcd', version);

    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);

    // add the docker service
    const svc = btcd(name, container, image, rpc, p2p, command);
    this.addService(svc);
    this.addBtcwallet(node);
  }

  addBtcwallet(backend: BitcoinNode) {
    const name = `btcwallet-${backend.name}`;
    const rpcPort = backend.ports.btcdWallet;
    const container = getContainerName(backend) + '-btcwallet';

    // // define the variable substitutions
    const variables = {
      rpcUser: btcdCredentials.user,
      rpcPass: btcdCredentials.pass,
      nodeName: backend.name,
    };

    // the btcwallet image version is tracked in dockerConfigs, not in the repo state,
    // since it is not a node that users can add to a network
    const image = dockerConfigs.btcwallet.imageName;
    // use the node's command
    const nodeCommand = [
      'btcwallet',
      '--regtest',
      '--username={{rpcUser}}',
      '--password={{rpcPass}}',
      '--rpclisten=0.0.0.0:18332',
      '--rpcconnect={{nodeName}}',
      '--cafile=/home/btcwallet/.btcd/rpc.cert',
    ].join('\n ');
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const svc = btcwallet(name, container, image, rpcPort, command, backend.name);
    this.addService(svc);
  }

  private mergeCommand(command: string, variables: Record<string, string>) {
    let merged = command;
    Object.keys(variables).forEach(key => {
      // intentionally not using .replace() because if a string is passed in, then only the first occurrence
      // is replaced. A RegExp could be used but the code would be more confusing because of escape chars
      merged = merged.split(`{{${key}}}`).join(variables[key]);
    });
    return merged;
  }
}

export default ComposeFile;
