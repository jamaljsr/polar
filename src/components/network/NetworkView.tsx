import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { RouteComponentProps } from 'react-router';
import { info } from 'electron-log';
import { Alert, PageHeader } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { StatusTag } from 'components/common';
import NetworkDesigner from 'components/designer/NetworkDesigner';
import NetworkActions from './NetworkActions';
import styles from './NetworkView.module.less';

interface MatchParams {
  id?: string;
}

interface Props {
  network: Network;
}

const NetworkViewWrap: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  const { networks } = useStoreState(s => s.network);
  if (match.params.id) {
    const networkId = parseInt(match.params.id);
    const network = networks.find(n => n.id === networkId);
    if (network) {
      // set the key to force React to mount a new instance when the route changes
      return <NetworkView network={network} key={match.params.id} />;
    }
  }
  return null;
};

const NetworkView: React.FC<Props> = ({ network }) => {
  useEffect(() => info('Rendering NetworkView component'), []);

  const { toggle } = useStoreActions(s => s.network);
  const toggleAsync = useAsyncCallback(async () => toggle(network.id));

  return (
    <>
      <PageHeader
        title={network.name}
        // onBack={() => {}}
        className={styles.header}
        tags={<StatusTag status={network.status} />}
        extra={<NetworkActions status={network.status} onClick={toggleAsync.execute} />}
      />
      {toggleAsync.error && <Alert type="error" message={toggleAsync.error.message} />}
      <NetworkDesigner network={network} />
    </>
  );
};

export default NetworkViewWrap;
