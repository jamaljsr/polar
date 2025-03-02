import React from 'react';
import styled from '@emotion/styled';
import { usePrefixedTranslation } from 'hooks';
import { Button, Empty } from 'antd';
import { Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const Styled = {
  Title: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-weight: bold;
  `,
};

const SimulationDesignerTab: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.designer.default.SimulationDesignerTab');

  return (
    <div>
      <Styled.Title>
        <span>{l('title')}</span>
        <Tooltip overlay={l('createBtn')} placement="topLeft">
          <Button type="text" icon={<PlusOutlined />} />
        </Tooltip>
      </Styled.Title>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l('emptyMsg')}>
        <Button type="primary" icon={<PlusOutlined />}>
          {l('createBtn')}
        </Button>
      </Empty>
    </div>
  );
};

export default SimulationDesignerTab;
