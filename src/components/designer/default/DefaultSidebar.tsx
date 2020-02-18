import React, { useState } from 'react';
import { CloudSyncOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Switch } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import SidebarCard from '../SidebarCard';
import SyncButton from '../SyncButton';
import DraggableNode from './DraggableNode';
import ImageUpdatesModal from './ImageUpdatesModal';

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
    justify-content: space-between;
    margin: 10px 5px;
  `,
  UpdatesButton: styled(Button)`
    margin-top: 30px;
  `,
};

interface Props {
  network: Network;
}

const DefaultSidebar: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.DefaultSidebar');

  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const { updateSettings } = useStoreActions(s => s.app);
  const { settings, dockerRepoState } = useStoreState(s => s.app);
  const showAll = settings.showAllNodeVersions;
  const currPlatform = getPolarPlatform();

  const toggleVersions = () => updateSettings({ showAllNodeVersions: !showAll });
  const toggleModal = () => setShowUpdatesModal(!showUpdatesModal);

  const nodes: {
    label: string;
    logo: string;
    version: string;
    type: string;
    latest: boolean;
    customId?: string;
  }[] = [];

  // add custom nodes
  settings.nodeImages.custom.forEach(image => {
    const { logo, platforms } = dockerConfigs[image.implementation];
    if (!platforms.includes(currPlatform)) return;
    nodes.push({
      label: `Custom [${image.dockerImage}]`,
      logo,
      version: image.dockerImage,
      type: image.implementation,
      latest: true,
      customId: image.id,
    });
  });

  // add managed nodes
  Object.entries(dockerRepoState.images).forEach(([type, entry]) => {
    const { name, logo, platforms } = dockerConfigs[type as NodeImplementation];
    if (!platforms.includes(currPlatform)) return;
    entry.versions.forEach(version => {
      const label = `${name} v${version}`;
      const latest = version === entry.latest;
      nodes.push({ label, logo, version, type, latest });
    });
  });

  return (
    <SidebarCard title={l('title')} extra={<SyncButton network={network} />}>
      <p>{l('mainDesc')}</p>
      <Styled.AddNodes>{l('addNodesTitle')}</Styled.AddNodes>
      <Styled.AddDesc>{l('addNodesDesc')}</Styled.AddDesc>
      <Styled.Toggle>
        <span>{l('showVersions')}</span>
        <Switch checked={showAll} onClick={toggleVersions} />
      </Styled.Toggle>
      {nodes.map(({ label, logo, version, latest, type, customId }) => (
        <DraggableNode
          key={version}
          label={label}
          desc={showAll && latest ? 'latest' : ''}
          icon={logo}
          properties={{ type, version, customId }}
          visible={showAll || latest}
        />
      ))}
      {showAll && (
        <Styled.UpdatesButton
          type="link"
          block
          icon={<CloudSyncOutlined />}
          onClick={toggleModal}
        >
          {l('checkUpdates')}
        </Styled.UpdatesButton>
      )}
      {showUpdatesModal && <ImageUpdatesModal onClose={toggleModal} />}
    </SidebarCard>
  );
};

export default DefaultSidebar;
