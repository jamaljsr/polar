/* exclude this function from test coverage because it pretty difficult to mock dependencies */
/* istanbul ignore file */
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { remote } from 'electron';
import { debug, info } from 'electron-log';
import styled from '@emotion/styled';
import 'xterm/css/xterm.css';
import Docker from 'dockerode';
import { usePrefixedTranslation } from 'hooks';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useStoreActions } from 'store';
import { eclairCredentials } from 'utils/constants';
import { nord } from './themes';

const docker = new Docker();
const termOptions: ITerminalOptions = {
  fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  fontSize: 12,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: 'bar',
  allowTransparency: true,
  theme: nord,
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

// I clearly got too carried away with this code here ;)
const yellow = (text: string) => `\x1b[33m${text}\u001b[0m`;
const green = (text: string) => `\x1b[32m${text}\u001b[0m`;
const randColor = (text: string) =>
  `\x1b[3${Math.floor(Math.random() * 6) + 1}m${text}\u001b[0m`;
const polar = `
   ____    U  ___ u   _        _       ____     
U |  _"\\ u  \\/"_ \\/  |"|   U  /"\\  uU |  _"\\ u  
 \\| |_) |/  | | | |U | | u  \\/ _ \\/  \\| |_) |/  
  |  __/.-,_| |_| | \\| |/__ / ___ \\   |  _ <    
  |_|    \\_)-\\___/   |_____|_/   \\_\\  |_| \\_\\   
  ||>>_       \\\\     //  \\\\ \\\\    >>  //   \\\\_  
 (__)__)     (__)   (_")("_)__)  (__)(__)  (__) 
`
  .split('')
  .map(char => (['U', 'u'].includes(char) ? randColor(char) : char))
  .join('');

// differing configs based on the type of node
const nodeConfig: Record<string, { user: string; alias: string }> = {
  LND: {
    user: 'lnd',
    alias: 'alias lncli="lncli --network regtest"',
  },
  'c-lightning': {
    user: 'clightning',
    alias: 'alias lightning-cli="lightning-cli --network regtest"',
  },
  eclair: {
    user: 'eclair',
    alias: `alias eclair-cli="eclair-cli -p ${eclairCredentials.pass}"`,
  },
  bitcoind: {
    user: 'bitcoin',
    alias: 'alias bitcoin-cli="bitcoin-cli -regtest"',
  },
};

/**
 * Connects the 'docker exec' i/o to the xterm UI
 * @param term the xterm instance
 * @param name the name of the docker container
 * @param type the type of node
 */
const connectStreams = async (term: Terminal, name: string, type: string, l: any) => {
  const config = nodeConfig[type];
  if (!config) throw new Error(l('nodeTypeErr', { type }));

  debug(`getting docker container with name '${name}'`);
  const containers = await docker.listContainers();
  debug(`all containers: ${JSON.stringify(containers)}`);
  const info = containers.find(c => c.Names.includes(`/${name}`));
  debug(`found: ${JSON.stringify(info, null, 2)}`);
  const container = info && docker.getContainer(info.Id);
  if (!container) throw new Error(l('containerErr', { name }));

  // create an exec instance
  const exec = await container.exec({ ...execCommand, User: config.user });
  // initialize the size of the docker session based on the xterm size
  exec.resize({ w: term.cols, h: term.rows });
  // run exec to connect to the container
  const stream = await exec.start(execOptions);

  // pass data from xterm to docker
  term.onData(data => stream.write(data));
  // pass data from docker to xterm
  stream.on('data', (data: Buffer) => term.write(data));
  // when the xterm is resized, also resize the docker session
  term.onResize(({ rows, cols }) => exec.resize({ w: cols, h: rows }));
  // close the window if the stream is closed (ex: 'exit' typed)
  stream.on('close', () => window.close());

  // run alias command
  const cli = /alias (.*)=/.exec(config.alias);
  if (cli) term.writeln(green(l('cliUpdating', { cli: cli[1] })));
  stream.write(`${config.alias}\n\n`);

  // close window if the container goes down while the terminal is open
  container.wait(() => window.close());
};

const Styled = {
  Term: styled.div`
    width: 100%;
    height: 100%;
    background-color: ${nord.background};
  `,
};

interface RouteParams {
  type: string;
  name: string;
}

const DockerTerminal: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.terminal.DockerTerminal');
  const { notify } = useStoreActions(s => s.app);
  const { type, name } = useParams<RouteParams>();
  const termEl = useRef<HTMLDivElement>(null);

  // add context menu
  useEffect(() => {
    window.addEventListener(
      'contextmenu',
      e => {
        e.preventDefault();
        const menu = remote.Menu.buildFromTemplate([
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
        ]);
        menu.popup({ window: remote.getCurrentWindow() });
      },
      false,
    );
  });

  useEffect(() => {
    info('Rendering DockerTerminal component');
    document.title = `Polar Terminal | ${name} (${type})`;

    // load the terminal UI
    const term = new Terminal(termOptions);
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termEl.current as HTMLDivElement);
    // write Polar logo to the console
    polar.split('\n').forEach(line => term.writeln(line));
    // write the connected message
    term.writeln(l('connected', { type: yellow(type), name: yellow(name) }));
    term.writeln('');

    // listen to resize events
    const resize = () => fitAddon.fit();
    window.addEventListener('resize', resize);
    // resize immediately
    resize();

    // to run async code in useEffect, you must wrap it in a function
    const connect = async () => {
      try {
        await connectStreams(term, name, type, l);
        term.focus();
      } catch (error: any) {
        notify({ message: l('connectErr'), error });
      }
    };
    // connect to the docker container
    connect();

    // return a cleanup function
    return () => {
      term.dispose();
      window.removeEventListener('resize', resize);
    };
  }, [notify, name, type, l]);

  return <Styled.Term ref={termEl} />;
};

export default DockerTerminal;
