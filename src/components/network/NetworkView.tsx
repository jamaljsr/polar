import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { info } from 'electron-log';
import { Alert, Col, Divider, Icon, PageHeader, Row } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { StatusTag } from 'components/common';
import BitcoindCard from './BitcoindCard';
import LndCard from './LndCard';
import NetworkActions from './NetworkActions';
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

/**
 * A wwrapper component around the NetworkView to detect an invalid network id.
 * Putting this in the main component causes issues with hooks and conditional flow
 */
const NetworkScreen: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  const { networkById } = useStoreState(s => s.network);
  let network: Network;
  try {
    network = networkById(match.params.id);
  } catch {
    // TODO redirect to the home screen
    return null;
  }
  return <NetworkView network={network} />;
};

const NetworkView: React.FC<{ network: Network }> = ({ network }) => {
  useEffect(() => info('Rendering NetworkView component'), []);

  const { t } = useTranslation();
  const { toggle, pullImages } = useStoreActions(s => s.network);

  const toggleAsync = useAsyncCallback(async () => toggle(network.id));
  const pullImagesAsync = useAsyncCallback(async () => pullImages(network.id));

  useEffect(() => {
    pullImagesAsync.execute();
    // eslint-disable-next-line
  }, [network.id]);

  const { lightning, bitcoin } = network.nodes;

  return (
    <>
      <PageHeader
        title={network.name}
        className={styles.header}
        tags={<StatusTag status={network.status} />}
        extra={
          <NetworkActions
            status={network.status}
            disabled={pullImagesAsync.loading}
            onClick={toggleAsync.execute}
          />
        }
      />
      {toggleAsync.error && <Alert type="error" message={toggleAsync.error.message} />}
      {pullImagesAsync.loading && (
        <Alert
          type="info"
          icon={<Icon type="loading" />}
          showIcon
          style={{ marginTop: '10px' }}
          message={t(
            'cmps.network-view.downloading-text',
            'Downloading docker images needed for this network to start',
          )}
        />
      )}
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

export default NetworkScreen;
