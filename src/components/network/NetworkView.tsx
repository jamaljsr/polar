import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { RouteComponentProps } from 'react-router';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import { Alert, PageHeader } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { StatusTag } from 'components/common';
import NetworkDesigner from 'components/designer/NetworkDesigner';
import { HOME } from 'components/routing';
import NetworkActions from './NetworkActions';

const Styled = {
  PageHeader: styled(PageHeader)`
    border: 1px solid rgb(235, 237, 240);
    background-color: #fff;
    margin-bottom: 10px;
  `,
};

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
  const { navigateTo } = useStoreActions(s => s.app);
  const toggleAsync = useAsyncCallback(async () => toggle(network.id));

  return (
    <>
      <Styled.PageHeader
        title={network.name}
        onBack={() => navigateTo(HOME)}
        tags={<StatusTag status={network.status} />}
        extra={<NetworkActions status={network.status} onClick={toggleAsync.execute} />}
      />
      {toggleAsync.error && <Alert type="error" message={toggleAsync.error.message} />}
      <NetworkDesigner network={network} />
    </>
  );
};

export default NetworkViewWrap;
