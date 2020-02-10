import React, { useEffect, useState } from 'react';
import { info } from 'electron-log';
import { PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Button, PageHeader } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { CustomNode } from 'types';
import { dockerConfigs } from 'utils/constants';
import { HOME } from 'components/routing';
import { CustomNodeModal, CustomNodesTable, ManagedNodesTable } from './';

const Styled = {
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 16px;
    flex: 0;
  `,
  Alert: styled(Alert)`
    margin-bottom: 16px;
  `,
};

const NodesView: React.FC = () => {
  useEffect(() => info('Rendering NodesView component'), []);
  const { l } = usePrefixedTranslation('cmps.nodes.NodesView');

  const theme = useTheme();
  const [addingNode, setAddingNode] = useState<CustomNode>();
  const { managedNodes, settings } = useStoreState(s => s.app);
  const { navigateTo } = useStoreActions(s => s.app);

  const handleAdd = () => {
    setAddingNode({
      id: '',
      implementation: 'LND',
      dockerImage: '',
      command: dockerConfigs.LND.command,
    });
  };

  return (
    <>
      <Styled.PageHeader
        title={l('title')}
        colors={theme.pageHeader}
        onBack={() => navigateTo(HOME)}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {l('addBtn')}
          </Button>
        }
      />
      <Styled.Alert
        type="warning"
        message={l('warnMsg')}
        description={l('warnDesc')}
        showIcon
      />

      <CustomNodesTable nodes={settings.nodes.custom} />
      <ManagedNodesTable nodes={managedNodes} />
      {addingNode && (
        <CustomNodeModal node={addingNode} onClose={() => setAddingNode(undefined)} />
      )}
    </>
  );
};

export default NodesView;
