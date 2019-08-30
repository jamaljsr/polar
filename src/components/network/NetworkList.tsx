import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Empty, Icon, Menu, Tooltip } from 'antd';
import { useStoreState } from 'store';
import { Network } from 'types';
import { NETWORK, NETWORK_VIEW } from 'components/routing';
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
      <Link to={NETWORK_VIEW(network.id)}>
        <Icon type="deployment-unit" />
        <span>{network.name}</span>
      </Link>
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
        {networks.length > 0 && (
          <Link to={NETWORK} className={styles.create}>
            <Tooltip
              title={t('cmps.network-list.create-icon-tooltip', 'Create a new Network')}
            >
              <Icon type="plus-circle" data-tid="create-icon" />
            </Tooltip>
          </Link>
        )}
      </header>
      <Menu
        theme="dark"
        mode="inline"
        openKeys={[activeId.toString()]}
        onOpenChange={handleOpenChange}
      >
        {networks.map(network => getNetworkItem(network))}
      </Menu>
      {networks.length === 0 && (
        <Empty
          className={styles.empty}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t(
            'cmps.network-list.empty-desc',
            'You have not created any local networks',
          )}
        >
          <Link to={NETWORK}>
            <Button type="primary" icon="plus" data-tid="create-btn">
              {t('cmps.network-list.create-button', 'New Network')}
            </Button>
          </Link>
        </Empty>
      )}
    </div>
  );
};

export default List;
