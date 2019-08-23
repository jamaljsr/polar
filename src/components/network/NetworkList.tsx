import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Icon } from 'antd';
import { useStoreState } from 'store';
import styles from './NetworkList.module.less';

const List: React.FC = () => {
  const { t } = useTranslation();
  const { networks } = useStoreState(s => s.network);
  const [activeId, setActiveId] = useState<number>(-1);

  const handleOpenChange = (openKeys: string[]) => {
    const newKey = openKeys.filter(x => x !== activeId.toString())[0];
    if (newKey) {
      setActiveId(parseInt(newKey));
    } else {
      setActiveId(-1);
    }
  };

  const getNetworkItem = (network: Network) => {
    const title = (
      <>
        <Icon type="deployment-unit" />
        <span>{network.name}</span>
      </>
    );
    const activeClass =
      styles.network + (network.id === activeId ? ' ' + styles.active : '');

    return (
      <Menu.SubMenu
        key={network.id}
        title={title}
        className={activeClass}
        data-tid={`network-${network.id}`}
      >
        <Menu.Item key="start" className={styles.item}>
          <Icon type="play-circle" className={styles.icon} />
          <span>{t('cmps.network-list.start', 'Start')}</span>
        </Menu.Item>
        <Menu.Item key="edit" className={styles.item}>
          <Icon type="form" className={styles.icon} />
          <span>{t('cmps.network-list.edit', 'Edit')}</span>
        </Menu.Item>
        <Menu.Item key="delete" className={styles.item}>
          <Icon type="close" className={styles.icon} />
          <span>{t('cmps.network-list.delete', 'Delete')}</span>
        </Menu.Item>
      </Menu.SubMenu>
    );
  };

  return (
    <div className={styles.networkList}>
      <header className={styles.header} data-tid="header">
        {t('cmps.network-list.title', 'Networks')}
      </header>
      <Menu
        theme="dark"
        mode="inline"
        openKeys={[activeId.toString()]}
        onOpenChange={handleOpenChange}
      >
        {networks.map(network => getNetworkItem(network))}
      </Menu>
    </div>
  );
};

export default List;
