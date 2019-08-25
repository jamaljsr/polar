import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { useTranslation } from 'react-i18next';
import { info } from 'electron-log';
import { PageHeader, Row, Col, Divider } from 'antd';
import { useStoreState } from 'store';
import { StatusTag } from 'components/common';
import NetworkActions from './NetworkActions';
import LndCard from './LndCard';
import BitcoindCard from './BitcoindCard';
import styles from './NetworkView.module.less';

interface MatchParams {
  id?: string;
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

const NetworkView: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  useEffect(() => info('Rendering NetworkView component'), []);

  const { t } = useTranslation();
  const network = useStoreState(s => s.network.networkById(match.params.id));
  if (!network) {
    return null;
  }

  const { lightning, bitcoin } = network.nodes;

  return (
    <>
      <PageHeader
        title={network.name}
        onBack={() => {}}
        className={styles.header}
        tags={<StatusTag status={network.status} />}
        extra={<NetworkActions status={network.status} />}
      />
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

export default NetworkView;
