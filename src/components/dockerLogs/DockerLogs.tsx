/* exclude this function from test coverage because it pretty difficult to mock dependencies */
/* istanbul ignore file */
import React, { useEffect, useState } from 'react';
import { LazyLog } from 'react-lazylog';
import { useParams } from 'react-router';
import { debug, error, info } from 'electron-log';
import styled from '@emotion/styled';
import detectPort from 'detect-port';
import Docker from 'dockerode';
import { usePrefixedTranslation } from 'hooks';
import { PassThrough } from 'stream';
import WebSocket from 'ws';
import { useStoreActions } from 'store';

const docker = new Docker();
let wsServer: WebSocket.Server;

/**
 * Starts a web socket server in order to stream logs from the docker
 * container to the LazyLog component. LazyLog unfortunately cannot
 * accept a stream directly, so we have a spin up a local WS server
 * just to proxy the logs.
 * @param name the name of the docker container
 * @returns the port that the web socket server is listening on
 */
const startWebSocketServer = async (name: string): Promise<number> => {
  const port = await detectPort(0);
  wsServer = new WebSocket.Server({ port });
  wsServer.on('connection', async socket => {
    debug(`getting docker container with name '${name}'`);
    const containers = await docker.listContainers();
    debug(`all containers: ${JSON.stringify(containers)}`);
    const details = containers.find(c => c.Names.includes(`/${name}`));
    debug(`found: ${JSON.stringify(details, null, 2)}`);
    const container = details && docker.getContainer(details.Id);
    if (!container) throw new Error(`Docker container '${name}' not found`);

    // get a stream of docker logs
    const dockerStream = await container.logs({
      follow: true,
      tail: 500,
      stdout: true,
      stderr: true,
    });
    // demux and merge stdin and stderr into one stream
    const logStream = new PassThrough();
    container.modem.demuxStream(dockerStream, logStream, logStream);
    // proxy logs from docker thru the web socket
    logStream.on('data', (data: Buffer) => socket.send(data.toString('utf-8')));
    // log errors
    logStream.on('error', e => error('logStream Error', e));
    // kill server if the container goes down while the logs window is open
    container.wait(() => {
      socket.send('\n** connection to docker terminated **\n\n');
      socket.close();
      wsServer.close();
    });
  });
  return port;
};

const Styled = {
  LazyLog: styled(LazyLog)`
    background-color: #2b2b2b75;
    color: #ffffff;
    // copied below styles from the default component's css
    overflow: auto !important;
    font-family: Monaco, source-code-pro, Menlo, Consolas, 'Courier New', monospace;
    font-size: 12px;
    margin: 0;
    white-space: pre;
    will-change: initial;
    outline: none;
  `,
};

interface RouteParams {
  type: string;
  name: string;
}

const DockerLogs: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.dockerLogs.DockerLogs');
  const { notify } = useStoreActions(s => s.app);
  const { type, name } = useParams<RouteParams>();
  const [port, setPort] = useState<number>();
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    info('Rendering DockerLogs component');
    document.title = `Docker Logs | ${name} (${type})`;

    // to run async code in useEffect, you must wrap it in a function
    const connect = async () => {
      try {
        setPort(await startWebSocketServer(name));
      } catch (error) {
        notify({ message: l('connectErr'), error });
      }
    };
    // connect to the docker container
    connect();

    // return a cleanup function to run on unmount
    return () => {
      info('close ws server');
      wsServer && wsServer.close();
    };
  }, [notify, name, type, l]);

  // display nothing until the WS server is online
  if (!port) return null;

  // a scroll handler that detects if the user has scrolled to the bottom. If so,
  // automatically stay at the bottom as new logs are streamed in
  const handleScroll = ({ scrollTop, scrollHeight, clientHeight }: any) => {
    if (follow && scrollHeight - scrollTop > clientHeight && clientHeight >= 0) {
      // scrolled up nd no longer viewing the bottom of the screen
      setFollow(false);
    } else if (!follow && scrollHeight - scrollTop <= clientHeight && clientHeight >= 0) {
      // scrolled to the bottom
      setFollow(true);
    }
  };

  return (
    <Styled.LazyLog
      url={`ws://127.0.0.1:${port}`}
      websocket
      enableSearch
      onScroll={handleScroll}
      follow={follow}
    />
  );
};

export default DockerLogs;
