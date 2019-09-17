import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Card } from 'antd';
import { NETWORK } from 'components/routing';
import styles from './GetStarted.module.less';

const GetStarted: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card title={t('cmps.get-started.title')}>
      <p className={styles.welcome}>{t('cmps.get-started.welcome-1')}</p>
      <p className={styles.welcome}>{t('cmps.get-started.welcome-2')}</p>
      <p className={styles.create}>
        <Link to={NETWORK}>
          <Button type="primary" size="large">
            {t('cmps.get-started.create-btn', 'Create your first Network')}
          </Button>
        </Link>
      </p>
    </Card>
  );
};

export default GetStarted;
