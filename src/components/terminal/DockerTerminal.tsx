/* exclude this function from test coverage because it pretty difficult to mock dependencies */
/* istanbul ignore file */
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { clipboard, remote } from 'electron';
import { debug, info } from 'electron-log';
import styled from '@emotion/styled';
import 'xterm/css/xterm.css';
import { message } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { getDocker } from 'lib/docker/dockerService';
import { useStoreActions } from 'store';
import { delay } from 'utils/async';
import { eclairCredentials } from 'utils/constants';
import { nord } from './themes';

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
const nodeConfig: Record<string, { user: string; commands: string[] }> = {
  LND: {
    user: 'lnd',
    commands: ['alias lncli="lncli --network regtest"'],
  },
  'c-lightning': {
    user: 'clightning',
    commands: ['alias lightning-cli="lightning-cli --network regtest"'],
  },
  eclair: {
    user: 'eclair',
    commands: [`alias eclair-cli="eclair-cli -p ${eclairCredentials.pass}"`],
  },
  bitcoind: {
    user: 'bitcoin',
    commands: ['alias bitcoin-cli="bitcoin-cli -regtest"'],
  },
  tapd: {
    user: 'tap',
    commands: ['alias tapcli="tapcli --network regtest --tapddir=~/.tapd"'],
  },
  litd: {
    user: 'litd',
    commands: [
      'alias litcli="litcli --network regtest"',
      'alias lncli="lncli --network regtest --rpcserver localhost:8443 --tlscertpath ~/.lit/tls.cert"',
      'alias tapcli="tapcli --network regtest --rpcserver localhost:8443 --tlscertpath ~/.lit/tls.cert"',
    ],
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

  const docker = await getDocker();
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

  // run alias commands
  const clis = config.commands
    .map(cmd => /alias (.*)=/.exec(cmd)?.[1])
    .filter(Boolean)
    .join(', ');
  term.writeln(green(l('cliUpdating', { cli: clis })));
  for (const cmd of config.commands) {
    // add a small delay to allow the terminal to respond. Without this, the lines in the
    // terminal are displayed out of order because the commands are sent to fast.
    await delay(50);
    stream.write(`${cmd}\n`);
  }
  stream.write('\n');

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

enum FontSizeChangeType {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  RESET = 'RESET',
}

const FONT_SIZE_DEFAULT = 12;
const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 20;

const termOptions: ITerminalOptions = {
  fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  fontSize: FONT_SIZE_DEFAULT,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: 'bar',
  allowTransparency: true,
  theme: nord,
};

const DockerTerminal: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.terminal.DockerTerminal');
  const { notify } = useStoreActions(s => s.app);
  const { type, name } = useParams<RouteParams>();
  const termEl = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal>();

  const fitAddon = new FitAddon();
  const resize = () => fitAddon.fit();

  const changeFontSize = (changeType: FontSizeChangeType) => {
    if (terminal?.current?.options.fontSize) {
      const currentFontSize = terminal.current.options.fontSize;

      switch (changeType) {
        case FontSizeChangeType.INCREASE:
          if (currentFontSize < FONT_SIZE_MAX) {
            terminal.current.options.fontSize += 1;
            resize();
          }
          break;
        case FontSizeChangeType.DECREASE:
          if (currentFontSize > FONT_SIZE_MIN) {
            terminal.current.options.fontSize -= 1;
            resize();
          }
          break;
        case FontSizeChangeType.RESET:
          terminal.current.options.fontSize = FONT_SIZE_DEFAULT;
          resize();
          break;
        default:
          break;
      }
    }
  };

  const contextMenuHandler = () => {
    const menu = remote.Menu.buildFromTemplate([
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ]);
    menu.popup({ window: remote.getCurrentWindow() });
  };

  const keyupEventHandler = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case '+':
        case '=':
          changeFontSize(FontSizeChangeType.INCREASE);
          break;
        case '-':
          changeFontSize(FontSizeChangeType.DECREASE);
          break;
        case '0':
          changeFontSize(FontSizeChangeType.RESET);
          break;
        case 'c':
        case 'C':
          if (e.shiftKey && terminal.current) {
            const selection = terminal.current.getSelection();
            if (selection) {
              clipboard.writeText(selection);
              message.info(l('cmps.common.CopyIcon.message', { label: '' }));
            }
          }
          break;
        case 'v':
        case 'V':
          if (e.shiftKey && terminal.current) {
            terminal.current.paste(clipboard.readText() || '');
          }
          break;
        default:
          break;
      }
    }
  };

  // add context menu
  useEffect(() => {
    window.addEventListener('contextmenu', contextMenuHandler, false);
    window.addEventListener('keyup', keyupEventHandler, false);

    return () => {
      window.removeEventListener('contextmenu', contextMenuHandler, false);
      window.removeEventListener('keyup', keyupEventHandler, false);
    };
  }, []);

  useEffect(() => {
    info('Rendering DockerTerminal component');
    document.title = `Polar Terminal | ${name} (${type})`;

    // load the terminal UI
    const term = new Terminal(termOptions);
    terminal.current = term;
    term.loadAddon(fitAddon);
    term.open(termEl.current as HTMLDivElement);
    // write Polar logo to the console
    polar.split('\n').forEach(line => term.writeln(line));
    // write the connected message
    term.writeln(l('connected', { type: yellow(type), name: yellow(name) }));
    term.writeln('');

    // listen to resize events
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
