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
import {
  bitcoind,
  btcd,
  btcwallet,
  clightning,
  eclair,
  litd,
  lnd,
  tapd,
  simln,
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
    const variables = {
      name: node.name,
      containerName: container,
      backendName: getContainerName(backend),
      rpcUser: credentials.user,
      rpcPass: credentials.pass,
    };

    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.LND.imageName}:${version}`;

    // use the node's custom command or generate btcd-specific command
    let nodeCommand: string;
    if (node.docker.command) {
      nodeCommand = node.docker.command;
    } else if (isBtcdBackend) {
      // LND command for btcd backend (no ZMQ, uses btcd RPC)
      nodeCommand = [
        'lnd',
        '--noseedbackup',
        '--trickledelay=5000',
        '--alias={{name}}',
        '--externalip={{containerName}}',
        '--tlsextradomain={{containerName}}',
        '--tlsextradomain={{name}}',
        '--tlsextradomain=host.docker.internal',
        '--listen=0.0.0.0:9735',
        '--rpclisten=0.0.0.0:10009',
        '--restlisten=0.0.0.0:8080',
        '--bitcoin.active',
        '--bitcoin.regtest',
        '--bitcoin.node=btcd',
        '--btcd.rpchost={{backendName}}',
        '--btcd.rpcuser={{rpcUser}}',
        '--btcd.rpcpass={{rpcPass}}',
        '--btcd.rawrpccert=/rpc/rpc.cert',
        '--accept-keysend',
        '--accept-amp',
      ].join('\n  ');
    } else {
      nodeCommand = getDefaultCommand('LND', version);
    }

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
    // add the docker service
    const svc = clightning(name, container, image, rest, grpc, p2p, command);
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
    const variables = {
      name: node.name,
      containerName: container,
      backendName: getContainerName(backend),
      rpcUser: credentials.user,
      rpcPass: credentials.pass,
      litdPass: litdCredentials.pass,
      proofCourier: getContainerName(proofCourier),
    };

    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.litd.imageName}:${version}`;

    // use the node's custom command or generate btcd-specific command
    let nodeCommand: string;
    if (node.docker.command) {
      nodeCommand = node.docker.command;
    } else if (isBtcdBackend) {
      // litd command for btcd backend (no ZMQ, uses btcd RPC)
      nodeCommand = [
        'litd',
        '--httpslisten=0.0.0.0:8443',
        '--uipassword={{litdPass}}',
        '--lnd-mode=integrated',
        '--network=regtest',
        '--lnd.noseedbackup',
        '--lnd.trickledelay=5000',
        '--lnd.alias={{name}}',
        '--lnd.externalip={{containerName}}',
        '--lnd.tlsextradomain={{containerName}}',
        '--lnd.tlsextradomain={{name}}',
        '--lnd.tlsextradomain=host.docker.internal',
        '--lnd.listen=0.0.0.0:9735',
        '--lnd.rpclisten=0.0.0.0:10009',
        '--lnd.restlisten=0.0.0.0:8080',
        '--lnd.bitcoin.active',
        '--lnd.bitcoin.regtest',
        '--lnd.bitcoin.node=btcd',
        '--lnd.btcd.rpchost={{backendName}}',
        '--lnd.btcd.rpcuser={{rpcUser}}',
        '--lnd.btcd.rpcpass={{rpcPass}}',
        '--lnd.btcd.rawrpccert=/rpc/rpc.cert',
        '--taproot-assets.allow-public-uni-proof-courier',
        '--taproot-assets.universe.public-access=rw',
        '--taproot-assets.universe.sync-all-assets',
        '--taproot-assets.allow-public-stats',
        '--taproot-assets.proofcourieraddr=universerpc://{{proofCourier}}:8443',
      ].join('\n  ');
    } else {
      nodeCommand = getDefaultCommand('litd', version);
    }

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
    const { grpc, p2p } = ports;
    const container = getContainerName(node);

    // define the variable substitutions
    const variables = {
      name,
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };

    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.btcd.imageName}:${version}`;

    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('btcd', version);

    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);

    // add the docker service
    const svc = btcd(name, container, image, grpc, p2p, command);
    this.addService(svc);
    this.addBtcwallet(node);
  }

  addBtcwallet(backend: BitcoinNode) {
    const name = `btcwallet-${backend.name}`;
    const rpcPort = backend.ports.btcdWallet;
    const container = getContainerName(backend) + '-btcwallet';

    // // define the variable substitutions
    const variables = {
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
      nodeName: backend.name,
    };

    // use the node's image
    const image = `polarlightning/btcwallet:0.16.13`;
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
