import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { RouteComponentProps } from 'react-router';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import { Alert, Empty, PageHeader } from 'antd';
import { useStoreActions, useStoreState } from 'store';
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

const NetworkView: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  useEffect(() => info('Rendering NetworkView component'), []);

  const { networks } = useStoreState(s => s.network);
  const networkId = parseInt(match.params.id || '');
  const network = networks.find(n => n.id === networkId);

  const { toggle } = useStoreActions(s => s.network);
  const toggleAsync = useAsyncCallback(toggle);
  const { navigateTo } = useStoreActions(s => s.app);

  useEffect(() => {
    if (!network) navigateTo(HOME);
  }, [network, navigateTo]);

  return !network ? null : (
    <Styled.NetworkView>
      <Styled.PageHeader
        title={network.name}
        onBack={() => navigateTo(HOME)}
        tags={<StatusTag status={network.status} />}
        extra={
          <NetworkActions
            network={network}
            onClick={() => toggleAsync.execute(network.id)}
          />
        }
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

export default NetworkView;
