import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { Network } from 'types';
import { LinkProperties } from 'utils/chart';
import Backend from './Backend';
import Channel from './Channel';

interface Props {
  link: ILink;
  network: Network;
}

const LinkDetails: React.FC<Props> = ({ link, network }) => {
  let cmp = <div>You&apos;ve somehow managed to select an invalid link</div>;

  const { bitcoin, lightning } = network.nodes;
  const { type } = link.properties as LinkProperties;
  switch (type) {
    case 'backend':
      const bitcoinNode = bitcoin.find(n => n.name === link.to.nodeId);
      const lightningNode = lightning.find(n => n.name === link.from.nodeId);
      if (bitcoinNode && lightningNode) {
        cmp = <Backend bitcoinNode={bitcoinNode} lightningNode={lightningNode} />;
      }
      break;
    case 'open-channel':
    case 'pending-channel':
      const from = lightning.find(n => n.name === link.from.nodeId);
      const to = lightning.find(n => n.name === link.to.nodeId);
      if (from && to) {
        cmp = <Channel link={link} from={from} to={to} />;
      }
      break;
  }

  return cmp;
};

export default LinkDetails;
