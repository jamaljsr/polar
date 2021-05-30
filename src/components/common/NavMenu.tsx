import React from 'react';
import { DatabaseOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Menu } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { NETWORK_IMPORT, NETWORK_NEW, NODE_IMAGES } from 'components/routing';

const Styled = {
  Menu: styled.div`
    float: right;

    .ant-menu-overflow-item-rest {
      display: none;
    }
  `,
};

const NavMenu: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.common.NavMenu');
  const { navigateTo } = useStoreActions(s => s.app);
  return (
    <Styled.Menu>
      <Menu theme="dark" mode="horizontal" selectable={false}>
        <Menu.Item key="createNetwork" onClick={() => navigateTo(NETWORK_NEW)}>
          <PlusOutlined />
          <span>{l('createNetwork')}</span>
        </Menu.Item>
        <Menu.Item key="importNetwork" onClick={() => navigateTo(NETWORK_IMPORT)}>
          <ImportOutlined />
          <span>{l('importNetwork')}</span>
        </Menu.Item>
        <Menu.Item key="manageNodes" onClick={() => navigateTo(NODE_IMAGES)}>
          <DatabaseOutlined />
          <span>{l('manageNodes')}</span>
        </Menu.Item>
      </Menu>
    </Styled.Menu>
  );
};

export default NavMenu;
