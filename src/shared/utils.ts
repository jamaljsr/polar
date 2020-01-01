import { app, remote } from 'electron';
import log from 'electron-log';
import { join } from 'path';

/**
 * setup logging to store log files in ~/.polar/logs/ dir
 */
export const initLogger = () => {
  log.transports.file.resolvePath = (variables: log.PathVariables) => {
    const ap = app || remote.app;
    return join(ap.getPath('home'), '.polar', 'logs', variables.fileName as string);
  };
};
