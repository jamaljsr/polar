import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button, Card } from 'antd';
import { NETWORK } from 'components/routing';

const Welcome = styled.p`
  text-align: center;
`;

const Create = styled.p`
  padding: 16px;
  text-align: center;
`;

const GetStarted: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card title={t('cmps.get-started.title')}>
      <Welcome>{t('cmps.get-started.welcome-1')}</Welcome>
      <Welcome>{t('cmps.get-started.welcome-2')}</Welcome>
      <Create>
        <Link to={NETWORK}>
          <Button type="primary" size="large">
            {t('cmps.get-started.create-btn', 'Create your first Network')}
          </Button>
        </Link>
      </Create>
    </Card>
  );
};

export default GetStarted;
