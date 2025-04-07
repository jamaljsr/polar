import React, { useCallback, useMemo } from 'react';
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Empty, Space, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LitdNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { DetailsList, Loader } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import LncSessionDrawer from './LncSessionDrawer';

const Styled = {
  Title: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-weight: bold;
  `,
};

interface Props {
  node: LitdNode;
}

const LncSessionsList: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.connect.LncSessionsList');

  const { nodes } = useStoreState(s => s.lit);
  const { showLncSessionInfo, showAddLncSession } = useStoreActions(s => s.modals);

  const handleDetails = useCallback(
    (sessionId: string) => () => showLncSessionInfo({ sessionId, nodeName: node.name }),
    [node.name, showLncSessionInfo],
  );

  const handleCreate = useCallback(() => {
    showAddLncSession({ nodeName: node.name });
  }, [node.name]);

  const { sessions } = useMemo(() => {
    return nodes[node.name] || {};
  }, [nodes]);

  if (!sessions) return <Loader />;

  const details: DetailValues = sessions.map(session => {
    return {
      label: session.label,
      value: (
        <Space>
          {session.state}
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={handleDetails(session.id.toString())}
          />
        </Space>
      ),
    };
  });

  return (
    <div>
      <Styled.Title>
        <span>{l('title')}</span>
        <Tooltip overlay={l('createBtn')} placement="topLeft">
          <Button type="text" icon={<PlusOutlined />} onClick={handleCreate} />
        </Tooltip>
      </Styled.Title>
      {details.length > 0 ? (
        <DetailsList details={details} />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l('emptyMsg')}>
          <Button type="primary" onClick={handleCreate}>
            {l('createBtn')}
          </Button>
        </Empty>
      )}
      <LncSessionDrawer node={node} />
    </div>
  );
};

export default LncSessionsList;
