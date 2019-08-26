import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { info } from 'electron-log';
import { NETWORK } from 'components/routing';

const Home = () => {
  useEffect(() => info('Rendering Home component'), []);
  const { t } = useTranslation();

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
