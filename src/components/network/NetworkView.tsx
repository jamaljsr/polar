import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import { Alert, Button, Empty, PageHeader } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { StatusTag } from 'components/common';
import NetworkDesigner from 'components/designer/NetworkDesigner';
import { HOME } from 'components/routing';
import NetworkActions from './NetworkActions';

const Styled = {
  Empty: styled(Empty)`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `,
  NetworkView: styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  PageHeader: styled(PageHeader)`
    border: 1px solid rgb(235, 237, 240);
    background-color: #fff;
    margin-bottom: 10px;
    flex: 0;
  `,
  NetworkDesigner: styled(NetworkDesigner)`
    flex: 1;
  `,
  Error: styled.pre`
    font-size: 11px;
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
  return (
    <Styled.Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={`Could not find a network with the id '${match.params.id}'`}
    >
      <Link to={HOME}>
        <Button type="primary" size="large">
          View Networks
        </Button>
      </Link>
    </Styled.Empty>
  );
};

const NetworkView: React.FC<Props> = ({ network }) => {
  useEffect(() => info('Rendering NetworkView component'), []);

  const { toggle } = useStoreActions(s => s.network);
  const toggleAsync = useAsyncCallback(async () => toggle(network.id));
  const { navigateTo } = useStoreActions(s => s.app);

  return (
    <Styled.NetworkView>
      <Styled.PageHeader
        title={network.name}
        onBack={() => navigateTo(HOME)}
        tags={<StatusTag status={network.status} />}
        extra={<NetworkActions status={network.status} onClick={toggleAsync.execute} />}
      />
      {/* TODO: display an info alert that the first startup may be slow */}
      {toggleAsync.error && (
        <Alert
          type="error"
          message={<Styled.Error>{toggleAsync.error.message}</Styled.Error>}
        />
      )}
      <Styled.NetworkDesigner network={network} />
    </Styled.NetworkView>
  );
};

export default NetworkViewWrap;
