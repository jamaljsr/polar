import * as compose from 'docker-compose';
import { info } from 'electron-log';
import { Network, DockerLibrary } from 'types';

class DockerService implements DockerLibrary {
  /**
   * Start a network using docper-compose
   * @param network the network to start
   */
  async start(network: Network) {
    info(`Starting docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.upAll, { cwd: network.path });
    info(`Network started:\n ${result.out || result.err}`);
  }

  /**
   * Stop a network using docker-compose
   * @param network the network to stop
   */
  async stop(network: Network) {
    info(`Stopping docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.stop, { cwd: network.path });
    info(`Network started:\n ${result.out || result.err}`);
  }

  /**
   * Helper method to trap and format exceptions thrown and
   * @param cmd the compose function to call
   * @param args the arguments to the compose function
   */
  private async execute<T, A>(cmd: (args: A) => Promise<T>, args: A): Promise<T> {
    try {
      return await cmd(args);
    } catch (e) {
      info(`docker cmd failed: ${JSON.stringify(e)}`);
      throw new Error(e.err);
    }
  }
}

export default new DockerService();
