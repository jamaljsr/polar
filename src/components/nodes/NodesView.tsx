import React, { useEffect } from 'react';
import { info } from 'electron-log';
import { PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, PageHeader } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { HOME } from 'components/routing';
import { CustomNodesTable, ManagedNodesTable } from './';

const Styled = {
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 10px;
    flex: 0;
  `,
};

const NodesView: React.FC = () => {
  useEffect(() => info('Rendering NodesView component'), []);
  const { l } = usePrefixedTranslation('cmps.nodes.NodesView');

  const theme = useTheme();
  const { managedNodes, settings } = useStoreState(s => s.app);
  const { navigateTo } = useStoreActions(s => s.app);

  return (
    <>
      <Styled.PageHeader
        title={l('title')}
        colors={theme.pageHeader}
        onBack={() => navigateTo(HOME)}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            {l('addBtn')}
          </Button>
        }
      />
      <CustomNodesTable nodes={settings.nodes.custom} />
      <ManagedNodesTable nodes={managedNodes} />
    </>
  );
};

export default NodesView;
