import React from 'react';
import styled from '@emotion/styled';
import { Dropdown, Icon, Menu } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { NETWORK } from 'components/routing';

const Styled = {
  Menu: styled.div`
    float: right;
  `,
  Icon: styled(Icon)`
    font-size: 1.2rem;
    color: #fff;
  `,
};

const NavMenu: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.common.NavMenu');
  const { navigateTo } = useStoreActions(s => s.app);
  const menu = (
    <Menu theme="dark">
      <Menu.Item onClick={() => navigateTo(NETWORK)}>
        <Icon type="plus-circle" />
        {l('createNetwork')}
      </Menu.Item>
      <Menu.Item>
        <Icon type="setting" />
        {l('settings')}
      </Menu.Item>
    </Menu>
  );

  return (
    <Styled.Menu>
      <Dropdown overlay={menu} trigger={['click']}>
        <Styled.Icon type="menu" />
      </Dropdown>
    </Styled.Menu>
  );
};

export default NavMenu;
