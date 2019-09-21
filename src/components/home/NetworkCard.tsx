import React from 'react';
import styled from '@emotion/styled';
import { Card, Col, Icon, Row, Statistic } from 'antd';
import { useStoreActions } from 'store';
import { Network } from 'types';
import { StatusBadge } from 'components/common';
import { NETWORK_VIEW } from 'components/routing';

const Styled = {
  Card: styled(Card)`
    margin-top: 16px;
  `,
};

const NetworkCard: React.FC<{ network: Network }> = ({ network }) => {
  const { navigateTo } = useStoreActions(s => s.app);

  return (
    <Styled.Card
      title={network.name}
      hoverable
      extra={<StatusBadge status={network.status} />}
      onClick={() => navigateTo(NETWORK_VIEW(network.id))}
    >
      <Row>
        <Col span={12}>
          <Statistic
            title="Lightning Nodes"
            value={network.nodes.lightning.length}
            suffix={<Icon type="thunderbolt" />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Bitcoin Nodes"
            value={network.nodes.bitcoin.length}
            suffix={<Icon type="link" />}
          />
        </Col>
      </Row>
    </Styled.Card>
  );
};

export default NetworkCard;
