import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { info } from 'electron-log';
import { Alert, Button, Card, notification } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { NETWORK, NETWORK_VIEW } from 'components/routing';

const Home = () => {
  useEffect(() => info('Rendering Home component'), []);
  const { t } = useTranslation();
  const { networks } = useStoreState(s => s.network);
  const { load } = useStoreActions(s => s.network);
  useEffect(() => {
    load().catch((e: Error) =>
      notification.error({
        message: t('cmps.home.load-error-msg', 'Unable to load previously save networks'),
        description: e.message,
        placement: 'bottomRight',
        bottom: 50,
      }),
    );
  }, [load, t]);

  const [showAlert, setShowAlert] = useState(false);
  const handleClickMe = () => setShowAlert(true);

  return (
    <div>
      {showAlert && (
        <Alert
          message={t('cmps.home.success-text')}
          type="success"
          showIcon
          data-tid="success"
        />
      )}
      <Card title={t('cmps.home.card-title')}>
        <p>{t('cmps.home.card-description')}</p>
        <p>
          <Trans i18nKey="cmps.home.play">
            Play with the{' '}
            <Link to={NETWORK} data-tid="network-link">
              Network
            </Link>{' '}
            thing
          </Trans>
        </p>
        <h3>Networks</h3>
        <ul>
          {networks.map(network => (
            <Link to={NETWORK_VIEW(network.id)} key={network.id}>
              {network.name}
            </Link>
          ))}
        </ul>
        <p>
          <Button type="primary" data-tid="me-btn" onClick={handleClickMe}>
            {t('cmps.home.me-btn')}
          </Button>
        </p>
      </Card>
    </div>
  );
};

export default Home;
