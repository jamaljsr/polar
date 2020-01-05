import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { LinkOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic } from 'antd';
import { usePrefixedTranslation } from 'hooks';
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
  const { l } = usePrefixedTranslation('cmps.home.NetworkCard');
  const { navigateTo } = useStoreActions(s => s.app);
  const { setActiveId } = useStoreActions(s => s.designer);

  const handleClick = useCallback(() => {
    setActiveId(network.id);
    navigateTo(NETWORK_VIEW(network.id));
  }, [network.id, setActiveId, navigateTo]);

  return (
    <Styled.Card
      title={network.name}
      hoverable
      extra={<StatusBadge status={network.status} />}
      onClick={handleClick}
    >
      <Row>
        <Col span={12}>
          <Statistic
            title={l('lightningNodes')}
            value={network.nodes.lightning.length}
            suffix={<ThunderboltOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={l('bitcoinNodes')}
            value={network.nodes.bitcoin.length}
            suffix={<LinkOutlined />}
          />
        </Col>
      </Row>
    </Styled.Card>
  );
};

export default NetworkCard;
