import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { usePrefixedTranslation } from 'hooks';
import { LndNode } from 'shared/types';
import { Network } from 'types';
import { LinkProperties } from 'utils/chart';
import SidebarCard from '../SidebarCard';
import SyncButton from '../SyncButton';
import Backend from './Backend';
import Channel from './Channel';
import Peer from './Peer';
import TapBackend from './TapBackend';

interface Props {
  link: ILink;
  network: Network;
}

const LinkDetails: React.FC<Props> = ({ link, network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.LinkDetails');

  let cmp = (
    <SidebarCard title={l('invalidTitle')} extra={<SyncButton network={network} />}>
      {l('invalidMsg')}
    </SidebarCard>
  );

  const { bitcoin, lightning, tap, ark } = network.nodes;
  const { type } = (link.properties as LinkProperties) || {};
  switch (type) {
    case 'backend':
      const bitcoinNode = bitcoin.find(n => n.name === link.to.nodeId);
      const lightningNode = [...lightning, ...ark].find(n => n.name === link.from.nodeId);
      if (bitcoinNode && lightningNode) {
        cmp = <Backend bitcoinNode={bitcoinNode} connectedNode={lightningNode} />;
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
    case 'btcpeer':
      const fromPeer = bitcoin.find(n => n.name === link.from.nodeId);
      const toPeer = bitcoin.find(n => n.name === link.to.nodeId);
      if (fromPeer && toPeer) {
        cmp = <Peer from={fromPeer} to={toPeer} />;
      }
      break;
    case 'lndbackend':
      const tapNode = tap.find(n => n.name === link.from.nodeId);
      const lndNode = lightning.find(n => n.name === link.to.nodeId);
      if (tapNode && lndNode) {
        cmp = <TapBackend from={tapNode} to={lndNode as LndNode} />;
      }
  }

  return cmp;
};

export default LinkDetails;
