import createLnrpc from '@radar/lnrpc';
import { ALICE_LND } from './config';
import NodeHandler from './nodeHandler';

(async () => {
  const lnrpc = await createLnrpc(ALICE_LND);
  const nodeHandler = new NodeHandler(lnrpc);
  nodeHandler.whatWouldYouLikeToDo();
})();
