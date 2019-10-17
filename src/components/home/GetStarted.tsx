import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { NETWORK } from 'components/routing';
import logobw from 'resources/logo_bw.png';

const Styled = {
  GetStarted: styled.div`
    width: 100%;
    height: 100%;
    background-image: url(${logobw});
    background-size: contain;
    background-position: center center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `,
  Header: styled.h1`
    font-size: 44px;
    font-weight: 300;
    margin-bottom: 30px;
  `,
};

const GetStarted: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Styled.GetStarted>
      <Styled.Header>{t('cmps.get-started.title', "Let's get started!")}</Styled.Header>
      <Link to={NETWORK}>
        <Button type="primary" size="large">
          {t('cmps.get-started.create-btn', 'Create a Lightning Network')}
        </Button>
      </Link>
    </Styled.GetStarted>
  );
};

export default GetStarted;
