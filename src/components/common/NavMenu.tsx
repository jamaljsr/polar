import React from 'react';
import {
  DatabaseOutlined,
  ImportOutlined,
  MenuOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Menu } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { NETWORK_IMPORT, NETWORK_NEW, NODE_IMAGES } from 'components/routing';

const Styled = {
  Menu: styled.div`
    float: right;
    margin-top: 9px;
  `,
  MenuIcon: styled(MenuOutlined)`
    font-size: 1.2rem;
    color: #fff;
  `,
  ImportIcon: styled(ImportOutlined)`
    font-size: 1.2rem;
    color: #fff;
  `,
};

const NavMenu: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.common.NavMenu');
  const { navigateTo } = useStoreActions(s => s.app);
  return (
    <Styled.Menu>
      <Menu theme="dark" mode="horizontal" selectable={false}>
        <Menu.Item onClick={() => navigateTo(NETWORK_NEW)}>
          <PlusOutlined />
          {l('createNetwork')}
        </Menu.Item>
        <Menu.Item onClick={() => navigateTo(NETWORK_IMPORT)}>
          <ImportOutlined />
          {l('importNetwork')}
        </Menu.Item>
        <Menu.Item onClick={() => navigateTo(NODE_IMAGES)}>
          <DatabaseOutlined />
          {l('manageNodes')}
        </Menu.Item>
      </Menu>
    </Styled.Menu>
  );
};

export default NavMenu;
