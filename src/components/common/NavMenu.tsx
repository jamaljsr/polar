import React from 'react';
import { Dropdown, Icon, Menu } from 'antd';
import { useStoreActions } from 'store';
import { NETWORK } from 'components/routing';
import styles from './NavMenu.module.less';

const NavMenu: React.FC = () => {
  const { navigateTo } = useStoreActions(s => s.app);
  const menu = (
    <Menu theme="dark">
      <Menu.Item onClick={() => navigateTo(NETWORK)}>
        <Icon type="plus-circle" />
        New Network
      </Menu.Item>
      <Menu.Item>
        <Icon type="setting" />
        Settings
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={styles.menu}>
      <Dropdown overlay={menu} trigger={['click']}>
        <Icon type="menu" className={styles.menuIcon} />
      </Dropdown>
    </div>
  );
};

export default NavMenu;
