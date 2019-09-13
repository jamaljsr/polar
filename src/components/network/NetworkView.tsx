import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { info } from 'electron-log';
import { Alert, Col, Divider, PageHeader, Row } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { StatusTag } from 'components/common';
import NetworkDesigner from 'components/designer/NetworkDesigner';
import BitcoindCard from './BitcoindCard';
import LndCard from './LndCard';
import NetworkActions from './NetworkActions';
import styles from './NetworkView.module.less';

interface MatchParams {
  id?: string;
}

interface Props {
  network: Network;
}

const btcDetails = [
  { label: 'Block Height', value: '432' },
  { label: 'Wallet Balance', value: '54.00000000' },
  { label: 'Host', value: '159.65.239.204' },
  { label: 'Version', value: 'v0.18.1' },
];

const lndDetails = [
  { label: 'PubKey', value: '0245....5fd47' },
  { label: 'Host', value: '159.65.239.204' },
  { label: 'Channels', value: '2' },
  { label: 'Synced to Chain', value: 'true' },
  { label: 'Chain Node', value: 'bitcoind1' },
  { label: 'Version', value: 'v0.7.1' },
];

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

  const { t } = useTranslation();
  const { toggle } = useStoreActions(s => s.network);
  const toggleAsync = useAsyncCallback(async () => toggle(network.id));

  const { lightning, bitcoin } = network.nodes;

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
      <Divider>{t('cmps.network-view.lightning-divider', 'Lightning Nodes')}</Divider>
      <Row gutter={16} data-tid="ln-nodes">
        {lightning.map(node => (
          <Col key={node.id} sm={24} md={12} lg={8} xl={6} xxl={4}>
            <LndCard node={node} details={lndDetails} className={styles.card} />
          </Col>
        ))}
      </Row>
      <Divider>{t('cmps.network-view.bitcoin-divider', 'Bitcoin Nodes')}</Divider>
      <Row gutter={16} data-tid="btc-nodes">
        {bitcoin.map(node => (
          <Col key={node.id} sm={24} md={12} lg={8} xl={6} xxl={4}>
            <BitcoindCard node={node} details={btcDetails} className={styles.card} />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default NetworkViewWrap;
