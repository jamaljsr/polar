import React, { useEffect, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { info } from 'electron-log';
import { Alert, Button, Card } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Loader } from 'components/common';
import { NETWORK, NETWORK_VIEW } from 'components/routing';

const Home = () => {
  useEffect(() => info('Rendering Home component'), []);
  const { t } = useTranslation();
  const { networks, loaded } = useStoreState(s => s.network);
  const { load } = useStoreActions(s => s.network);
  const loadAsync = useAsync(() => load(), [], { executeOnMount: !loaded });

  const [showAlert, setShowAlert] = useState(false);
  const handleClickMe = () => setShowAlert(true);

  if (loadAsync.loading) {
    return <Loader />;
  }

  return (
    <div>
      {showAlert && (
        <Alert message={t('cmps.home.success-text')} type="success" showIcon />
      )}
      {loadAsync.error && (
        <Alert
          type="error"
          showIcon
          closable
          message={t(
            'cmps.home.load-error-msg',
            'Unable to load previously save networks',
          )}
          description={loadAsync.error.message}
        />
      )}
      <Card title={t('cmps.home.card-title')}>
        <p>{t('cmps.home.card-description')}</p>
        <p>
          <Trans i18nKey="cmps.home.play">
            Play with the <Link to={NETWORK}>Network</Link> thing
          </Trans>
        </p>
        <p>
          <Button type="primary" onClick={handleClickMe}>
            {t('cmps.home.me-btn')}
          </Button>
        </p>
        <h3>Networks</h3>
        <ul>
          {networks.map(network => (
            <li key={network.id}>
              <Link to={NETWORK_VIEW(network.id)}>{network.name}</Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default Home;
