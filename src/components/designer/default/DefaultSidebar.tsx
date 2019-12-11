import React from 'react';
import styled from '@emotion/styled';
import { usePrefixedTranslation } from 'hooks';
import { BitcoindVersion, CLightningVersion, LndVersion } from 'shared/types';
import { Network } from 'types';
import bitcoindLogo from 'resources/bitcoin.svg';
import clightningLogo from 'resources/clightning.png';
import lndLogo from 'resources/lnd.png';
import SidebarCard from '../SidebarCard';
import SyncButton from '../SyncButton';
import DraggableNode from './DraggableNode';

const Styled = {
  AddNodes: styled.h3`
    margin-top: 30px;
  `,
  AddDesc: styled.p`
    opacity: 0.5;
    font-size: 12px;
  `,
};

interface Props {
  network: Network;
}

const DefaultSidebar: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.DefaultSidebar');

  return (
    <SidebarCard title={l('title')} extra={<SyncButton network={network} />}>
      <p>{l('mainDesc')}</p>
      <Styled.AddNodes>{l('addNodesTitle')}</Styled.AddNodes>
      <Styled.AddDesc>{l('addNodesDesc')}</Styled.AddDesc>
      {Object.keys(LndVersion)
        .filter(v => v !== 'latest')
        .map(version => (
          <DraggableNode
            key={version}
            label={`LND v${version}`}
            icon={lndLogo}
            properties={{ type: 'lnd', version }}
          />
        ))}
      {Object.keys(CLightningVersion)
        .filter(v => v !== 'latest')
        .map(version => (
          <DraggableNode
            key={version}
            label={`c-lightning v${version}`}
            icon={clightningLogo}
            properties={{ type: 'c-lightning', version }}
          />
        ))}
      {Object.keys(BitcoindVersion)
        .filter(v => v !== 'latest')
        .map(version => (
          <DraggableNode
            key={version}
            label={`Bitcoin Core v${version}`}
            icon={bitcoindLogo}
            properties={{ type: 'bitcoind', version }}
          />
        ))}
    </SidebarCard>
  );
};

export default DefaultSidebar;
