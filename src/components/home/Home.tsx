import React, { useEffect } from 'react';
import { useAsync } from 'react-async-hook';
import { info } from 'electron-log';
import { Col, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { Loader } from 'components/common';
import { DetectDockerModal, GetStarted, NetworkCard } from './';

const Home: React.FC = () => {
  useEffect(() => info('Rendering Home component'), []);

  const { l } = usePrefixedTranslation('cmps.home.Home');
  const { notify, initialize } = useStoreActions(s => s.app);
  const { networks } = useStoreState(s => s.network);
  const { initialized } = useStoreState(s => s.app);
  const initAsync = useAsync(
    async () => {
      try {
        await initialize();
      } catch (error) {
        notify({ message: l('loadError'), error });
      }
    },
    [],
    { executeOnMount: !initialized },
  );

  if (initAsync.loading) {
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
      <DetectDockerModal />
    </>
  );
};

export default Home;
