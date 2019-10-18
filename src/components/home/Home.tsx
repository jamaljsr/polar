import React, { useEffect } from 'react';
import { useAsync } from 'react-async-hook';
import { info } from 'electron-log';
import { Col, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { Loader } from 'components/common';
import { GetStarted, NetworkCard } from './';

const Home: React.FC = () => {
  useEffect(() => info('Rendering Home component'), []);

  const { l } = usePrefixedTranslation('cmps.home.Home');
  const { notify } = useStoreActions(s => s.app);
  const { networks, loaded } = useStoreState(s => s.network);
  const { load } = useStoreActions(s => s.network);
  const loadAsync = useAsync(
    async () => {
      try {
        await load();
      } catch (error) {
        notify({ message: l('loadError'), error });
      }
    },
    [],
    { executeOnMount: !loaded },
  );

  if (loadAsync.loading) {
    return <Loader />;
  }

  return (
    <>
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
