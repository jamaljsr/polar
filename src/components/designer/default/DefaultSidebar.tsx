import React from 'react';
import styled from '@emotion/styled';
import { Switch } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoindVersion, CLightningVersion, LndVersion } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
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
  Toggle: styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10px 5px;
  `,
};

interface Props {
  network: Network;
}

const DefaultSidebar: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.DefaultSidebar');

  const { showAllNodeVersions } = useStoreState(s => s.app.settings);
  const { setSettings } = useStoreActions(s => s.app);

  const toggle = () => {
    setSettings({ showAllNodeVersions: !showAllNodeVersions });
  };

  const mapVersion = (name: string, logo: string, type: string) => ([key, version]: [
    string,
    string,
  ]) => ({
    name,
    logo,
    version,
    type,
    latest: key === 'latest',
  });

  const nodes = [
    ...Object.entries(LndVersion).map(mapVersion('LND', lndLogo, 'lnd')),
    ...Object.entries(CLightningVersion).map(
      mapVersion('c-lightning', clightningLogo, 'c-lightning'),
    ),
    ...Object.entries(BitcoindVersion).map(
      mapVersion('Bitcoin Core', bitcoindLogo, 'bitcoind'),
    ),
  ].filter(n => showAllNodeVersions || n.latest);

  return (
    <SidebarCard title={l('title')} extra={<SyncButton network={network} />}>
      <p>{l('mainDesc')}</p>
      <Styled.AddNodes>{l('addNodesTitle')}</Styled.AddNodes>
      <Styled.AddDesc>{l('addNodesDesc')}</Styled.AddDesc>
      <Styled.Toggle>
        <span>{l('showVersions')}</span>
        <Switch checked={showAllNodeVersions} onClick={toggle} />
      </Styled.Toggle>
      {nodes.map(({ name, logo, version, latest, type }) => (
        <DraggableNode
          key={version}
          label={`${name} v${version}`}
          desc={showAllNodeVersions && latest ? 'latest' : ''}
          icon={logo}
          properties={{ type, version }}
        />
      ))}
    </SidebarCard>
  );
};

export default DefaultSidebar;
