import React, { useCallback } from 'react';
import { ApiOutlined, LinkOutlined, ThunderboltOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Card, Col, Row, Statistic } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { Network } from 'types';
import { StatusBadge } from 'components/common';

const Styled = {
  Card: styled(Card)`
    margin-top: 16px;
  `,
};

const NetworkCard: React.FC<{ network: Network }> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.home.NetworkCard');
  const { navigateToNetwork } = useStoreActions(s => s.app);

  const handleClick = useCallback(() => {
    navigateToNetwork(network.id);
  }, [network.id, navigateToNetwork]);

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
        <Col span={12}>
          <Statistic
            title={l('taroNodes')}
            value={network.nodes.taro.length}
            suffix={<ApiOutlined />}
          />
        </Col>
      </Row>
    </Styled.Card>
  );
};

export default NetworkCard;
