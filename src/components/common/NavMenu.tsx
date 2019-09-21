import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Dropdown, Icon, Menu } from 'antd';
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
  const { t } = useTranslation();
  const { navigateTo } = useStoreActions(s => s.app);
  const menu = (
    <Menu theme="dark">
      <Menu.Item onClick={() => navigateTo(NETWORK)}>
        <Icon type="plus-circle" />
        {t('cmps.nav-menu.create-network', 'Create Network')}
      </Menu.Item>
      <Menu.Item>
        <Icon type="setting" />
        {t('cmps.nav-menu.settings', 'Settings')}
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
