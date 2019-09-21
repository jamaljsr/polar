import React, { useEffect } from 'react';
import { useAsync } from 'react-async-hook';
import { useTranslation } from 'react-i18next';
import { info } from 'electron-log';
import { Alert, Col, Row } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Loader } from 'components/common';
import { GetStarted, NetworkCard } from './';

const Home: React.FC = () => {
  useEffect(() => info('Rendering Home component'), []);

  const { t } = useTranslation();
  const { networks, loaded } = useStoreState(s => s.network);
  const { load } = useStoreActions(s => s.network);
  const loadAsync = useAsync(() => load(), [], { executeOnMount: !loaded });

  if (loadAsync.loading) {
    return <Loader />;
  }

  return (
    <>
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
      {networks.length === 0 && <GetStarted />}
      <Row gutter={16}>
        {networks.map(n => (
          <Col key={n.id} sm={24} md={12} lg={8} xl={6} xxl={4}>
            <NetworkCard network={n} />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Home;
