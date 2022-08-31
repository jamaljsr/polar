import React from 'react';
import { CloudSyncOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Switch } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import SidebarCard from '../SidebarCard';
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
    justify-content: space-between;
    margin: 10px 5px;
  `,
  UpdatesButton: styled(Button)`
    margin-top: 30px;
  `,
};

const DefaultSidebar: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.designer.default.DefaultSidebar');

  const { updateSettings } = useStoreActions(s => s.app);
  const { showImageUpdates } = useStoreActions(s => s.modals);
  const { settings, dockerRepoState } = useStoreState(s => s.app);
  const showAll = settings.showAllNodeVersions;
  const currPlatform = getPolarPlatform();

  const toggleVersions = () => updateSettings({ showAllNodeVersions: !showAll });
  const toggleModal = () => showImageUpdates();

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
    const { latest } = dockerRepoState.images[image.implementation];
    if (!platforms.includes(currPlatform)) return;
    nodes.push({
      label: image.name,
      logo,
      version: latest,
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
    <SidebarCard title={l('title')}>
      <p>{l('mainDesc')}</p>
      <Styled.AddNodes>{l('addNodesTitle')}</Styled.AddNodes>
      <Styled.AddDesc>{l('addNodesDesc')}</Styled.AddDesc>
      <Styled.Toggle>
        <span>{l('showVersions')}</span>
        <Switch checked={showAll} onClick={toggleVersions} />
      </Styled.Toggle>
      {nodes.map(({ label, logo, version, latest, type, customId }) => (
        <DraggableNode
          key={label}
          label={label}
          desc={showAll && latest ? 'latest' : ''}
          icon={logo}
          properties={{ type, version, customId }}
          visible={showAll || latest}
        />
      ))}
      <Styled.UpdatesButton
        type="link"
        block
        icon={<CloudSyncOutlined />}
        onClick={toggleModal}
      >
        {l('checkUpdates')}
      </Styled.UpdatesButton>
    </SidebarCard>
  );
};

export default DefaultSidebar;
