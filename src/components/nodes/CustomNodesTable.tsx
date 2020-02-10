import React, { useState } from 'react';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Table } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { CustomNode } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import { CustomNodeModal } from './';

const Styled = {
  Table: styled(Table)`
    margin: 20px 0;
  `,
  Logo: styled.img`
    width: 24px;
    height: 24px;
    margin-right: 10px;
  `,
  DeleteButton: styled(Button)`
    color: #a61d24;
    &:hover {
      color: #800f19;
    }
  `,
};

interface CustomNodeView {
  id: string;
  implementation: NodeImplementation;
  name: string;
  dockerImage: string;
  logo: string;
  command: string;
}

interface Props {
  nodes: CustomNode[];
}

const CustomNodesTable: React.FC<Props> = ({ nodes }) => {
  const { l } = usePrefixedTranslation('cmps.nodes.CustomNodesTable');
  const currPlatform = getPolarPlatform();
  const [editingNode, setEditingNode] = useState<CustomNode>();

  const handleEdit = (node: CustomNodeView) => {
    const { id, implementation, dockerImage, command } = node;
    setEditingNode({ id, implementation, dockerImage, command });
  };

  const handleDelete = (node: CustomNodeView) => {
    console.warn(node);
  };

  // don't show the table if there are no custom nodes
  if (!nodes.length) {
    return null;
  }

  const customNodes: CustomNodeView[] = [];
  nodes.forEach(({ id, implementation, dockerImage, command }) => {
    const { name, logo, platforms } = dockerConfigs[implementation];
    if (!platforms.includes(currPlatform)) return;
    customNodes.push({ id, implementation, name, dockerImage, logo, command });
  });

  return (
    <>
      <Styled.Table
        dataSource={customNodes}
        title={() => l('title')}
        pagination={false}
        rowKey="id"
      >
        <Table.Column
          title={l('implementation')}
          dataIndex="name"
          render={(name: string, node: CustomNodeView) => (
            <span key="name">
              <Styled.Logo src={node.logo} />
              {name}
            </span>
          )}
        />
        <Table.Column title={l('dockerImage')} dataIndex="dockerImage" />
        <Table.Column title={l('command')} dataIndex="command" ellipsis />
        <Table.Column
          title={l('manage')}
          width={200}
          align="right"
          render={(_, node: CustomNodeView) => (
            <>
              <Button
                type="link"
                icon={<FormOutlined />}
                onClick={() => handleEdit(node)}
              >
                {l('edit')}
              </Button>
              <Styled.DeleteButton
                type="link"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(node)}
              ></Styled.DeleteButton>
            </>
          )}
        />
      </Styled.Table>
      {editingNode && (
        <CustomNodeModal node={editingNode} onClose={() => setEditingNode(undefined)} />
      )}
    </>
  );
};

export default CustomNodesTable;
