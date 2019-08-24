import React from 'react';
import { RouteComponentProps } from 'react-router';
import { useStoreState } from 'store';
import {
  PageHeader,
  Tag,
  Menu,
  Icon,
  Dropdown,
  Row,
  Col,
  Card,
  Divider,
  Avatar,
  Badge,
} from 'antd';
import lnd from 'resources/lnd.png';
import btc from 'resources/bitcoin.svg';
import styles from './NetworkView.module.less';
import { DetailsList } from 'components/common';

interface MatchParams {
  id?: string;
}

const lndDetails = [
  { label: 'PubKey', value: '0245....5fd47' },
  { label: 'Host', value: '159.65.239.204:9735' },
  { label: 'Channels', value: '2' },
  { label: 'Synced to Chain', value: 'true' },
  { label: 'Chain Node', value: 'bitcoind1' },
  { label: 'Version', value: 'v0.7.1' },
];

const btcDetails = [
  { label: 'Block Height', value: '432' },
  { label: 'Wallet Balance', value: '54.00000000' },
  { label: 'Host', value: '159.65.239.204:8443' },
  { label: 'Version', value: 'v0.18.1' },
];

const NetworkView: React.SFC<RouteComponentProps<MatchParams>> = ({ match }) => {
  const network = useStoreState(s => s.network.networkById(match.params.id));
  if (!network) {
    return null;
  }
  const { lightning, bitcoin } = network.nodes;
  const menu = (
    <Menu theme="dark">
      <Menu.Item key="1">
        <Icon type="form" />
        Edit
      </Menu.Item>
      <Menu.Item key="2">
        <Icon type="close" />
        Delete
      </Menu.Item>
    </Menu>
  );
  return (
    <>
      <PageHeader
        title={network.name}
        subTitle="1 bitcoind, 2 LND"
        onBack={() => {}}
        className={styles.header}
        tags={<Tag color="#3e3e3e">Stopped</Tag>}
        extra={
          <Dropdown.Button overlay={menu} type="primary">
            <Icon type="play-circle" />
            Start
          </Dropdown.Button>
        }
      />
      <Row gutter={16}>
        <Divider>Lightning Nodes</Divider>
      </Row>
      <Row gutter={16}>
        {lightning.map(node => (
          <Col key={node.id} span={8}>
            <Card
              title={
                <>
                  <Badge status="success" />
                  {node.name}
                </>
              }
              extra={<Avatar src={lnd} shape="square" size="small" />}
              actions={[
                <Icon type="code" key="code" />,
                <Icon type="file-text" key="logs" />,
                <Icon type="ellipsis" key="ellipsis" />,
              ]}
            >
              <DetailsList details={lndDetails} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Divider>Bitcoin Nodes</Divider>
      </Row>
      <Row gutter={16}>
        {bitcoin.map(node => (
          <Col key={node.id} span={8}>
            <Card
              title={
                <>
                  <Badge status="success" />
                  {node.name}
                </>
              }
              extra={<Avatar src={btc} shape="square" size="small" />}
              actions={[
                <Icon type="code" key="code" />,
                <Icon type="file-text" key="logs" />,
                <Icon type="ellipsis" key="ellipsis" />,
              ]}
            >
              <DetailsList details={btcDetails} />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default NetworkView;
