import React, { useCallback } from 'react';
import { UnorderedListOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Divider, Space } from 'antd';
import { TaroBalance } from 'lib/taro/types';
import { format } from 'utils/units';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

const Styled = {
  Wrapper: styled.div``,
};

interface Props {
  title: string;
  balances: TaroBalance[];
}

const AssetsList: React.FC<Props> = ({ title, balances }) => {
  const handleClick = useCallback(
    (id: string) => () => {
      const filtered = balances.filter(a => a.id === id);
      console.warn('AssetsList', filtered);
    },
    [balances],
  );

  const assetDetails: DetailValues = [];
  balances.forEach(asset => {
    assetDetails.push({
      label: asset.name,
      value: (
        <Space>
          {format(asset.balance)}
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={handleClick(asset.id)}
          />
        </Space>
      ),
    });
  });

  const { Wrapper } = Styled;
  return (
    <Wrapper>
      <Divider>{title}</Divider>
      <DetailsList details={assetDetails} />
    </Wrapper>
  );
};

export default AssetsList;
