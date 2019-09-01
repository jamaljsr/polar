import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Icon, Menu, notification, Tooltip } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { NETWORK, NETWORK_VIEW } from 'components/routing';
import styles from './NetworkList.module.less';

const List: React.FC = () => {
  const { t } = useTranslation();
  const { networks } = useStoreState(s => s.network);
  const { sidebarCollapsed } = useStoreState(s => s.app);
  const { load } = useStoreActions(s => s.network);
  useEffect(() => {
    load().catch((e: Error) =>
      notification.error({
        message: t(
          'cmps.network-list.load-error-msg',
          'Unable to load previously save networks',
        ),
        description: e.message,
        placement: 'bottomRight',
        bottom: 50,
      }),
    );
  }, [load, t]);

  const getNetworkItem = (network: Network) => {
    return (
      <Menu.Item key={network.id} data-tid={`network-${network.id}`}>
        <Link to={NETWORK_VIEW(network.id)}>
          <Icon type="deployment-unit" />
          <span>{network.name}</span>
        </Link>
      </Menu.Item>
    );
  };

  const headerClass = sidebarCollapsed
    ? `${styles.header} ${styles.collapsed}`
    : styles.header;

  return (
    <div className={styles.networkList}>
      <header className={headerClass} data-tid="header">
        {!sidebarCollapsed && (
          <span className={styles.title}>{t('cmps.network-list.title', 'Networks')}</span>
        )}
        <Tooltip
          title={t('cmps.network-list.create-icon-tooltip', 'Create a new Network')}
          placement="right"
        >
          <Link to={NETWORK} className={styles.create}>
            <Icon type="plus-circle" data-tid="create-icon" />
          </Link>
        </Tooltip>
      </header>
      <Menu theme="dark" mode="inline" selectable={false}>
        {networks.map(network => getNetworkItem(network))}
      </Menu>
    </div>
  );
};

export default List;
