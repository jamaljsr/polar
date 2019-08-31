import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Empty, Icon, Menu, notification, Tooltip } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { NETWORK, NETWORK_VIEW } from 'components/routing';
import styles from './NetworkList.module.less';

const List: React.FC = () => {
  const { t } = useTranslation();
  const { networks } = useStoreState(s => s.network);
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

  return (
    <div className={styles.networkList}>
      <header className={styles.header} data-tid="header">
        <span className={styles.title}>{t('cmps.network-list.title', 'Networks')}</span>
        {networks.length > 0 && (
          <Link to={NETWORK} className={styles.create}>
            <Tooltip
              title={t('cmps.network-list.create-icon-tooltip', 'Create a new Network')}
              placement="right"
            >
              <Icon type="plus-circle" data-tid="create-icon" />
            </Tooltip>
          </Link>
        )}
      </header>
      <Menu theme="dark" mode="inline">
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
