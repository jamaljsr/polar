import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { debug, info } from 'electron-log';
import styled from '@emotion/styled';
import 'xterm/css/xterm.css';
import Docker from 'dockerode';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useStoreActions } from 'store';

const docker = new Docker();
const termOptions: ITerminalOptions = {
  fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  fontSize: 13,
  cursorBlink: true,
  cursorStyle: 'bar',
};

// exec command and options configuration
const execCommand = {
  AttachStdout: true,
  AttachStderr: true,
  AttachStdin: true,
  Tty: true,
  Cmd: ['/bin/bash'],
};

const execOptions = {
  Tty: true,
  stream: true,
  stdin: true,
  stdout: true,
  stderr: true,
  // fix vim
  hijack: true,
};

// differing configs based on the type of node
const nodeConfig: Record<string, { user: string; alias: string }> = {
  LND: {
    user: 'lnd',
    alias: 'alias lncli="`which lncli` --network regtest"',
  },
  bitcoind: {
    user: 'bitcoin',
    alias: 'alias bitcoin-cli="`which bitcoin-cli` -regtest"',
  },
};

/**
 * Connects the 'docker exec' i/o to the xterm UI
 * @param term the xterm instance
 * @param name the name of the docker container
 * @param type the type of node
 */
const connect = async (term: Terminal, name: string, type: string) => {
  const config = nodeConfig[type];
  if (!config) throw new Error(`Invalid node type '${type}'`);

  debug(`getting docker container with name '${name}'`);
  const containers = await docker.listContainers();
  debug(`all containers: ${JSON.stringify(containers)}`);
  const info = containers.find(c => c.Names.includes(`/${name}`));
  debug(`found: ${info}`);
  const container = info && docker.getContainer(info.Id);
  if (!container) throw new Error(`Docker container '${name}' not found`);

  // create an exec instance
  const exec = await container.exec({ ...execCommand, User: config.user });
  // run exec to connect to the container
  const stream = await exec.start(execOptions);
  // connect io streams
  stream.on('data', (data: any) => term.write(data));
  term.onData(data => stream.write(data));
  // run alias command
  stream.write(`${config.alias}\n`);
  // handle the container going down while the terminal is open
  container.wait(() => term.write('** container shutdown **'));
};

const Styled = {
  Term: styled.div`
    width: 100%;
    height: 100%;
  `,
};

interface RouteParams {
  type: string;
  name: string;
}

const DockerTerminal: React.FC = () => {
  const { notify } = useStoreActions(s => s.app);
  const { type, name } = useParams<RouteParams>();
  const termEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    info('Rendering DockerTerminal component');

    // load the terminal UI
    const term = new Terminal(termOptions);
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termEl.current as HTMLDivElement);
    fitAddon.fit();

    // connect to docker
    connect(
      term,
      name,
      type,
    )
      .then(() => term.focus())
      .catch(error => notify({ message: 'Unable to connect to terminal', error }));

    return () => {
      term.dispose();
    };
  }, [notify, name, type]);

  return <Styled.Term ref={termEl} />;
};

export default DockerTerminal;
