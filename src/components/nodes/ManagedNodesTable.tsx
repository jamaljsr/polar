import React, { useState } from 'react';
import { FormOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Table, Tag } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { ManagedNode } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import { ManagedNodeModal } from './';

const Styled = {
  Table: styled(Table)`
    margin: 20px 0;
  `,
  Logo: styled.img`
    width: 24px;
    height: 24px;
    margin-right: 10px;
  `,
};

interface ManagedNodeView {
  index: number;
  implementation: NodeImplementation;
  name: string;
  imageName: string;
  logo: string;
  version: string;
  command: string;
}

interface Props {
  nodes: ManagedNode[];
}

const ManagedNodesTable: React.FC<Props> = ({ nodes }) => {
  const { l } = usePrefixedTranslation('cmps.nodes.ManagedNodesTable');
  const currPlatform = getPolarPlatform();
  const [editingNode, setEditingNode] = useState<ManagedNode>();

  const handleCustomize = (node: ManagedNodeView) => {
    const { implementation, version, command } = node;
    setEditingNode({ implementation, version, command });
  };

  const managedNodes: ManagedNodeView[] = [];
  nodes.forEach(({ implementation, version, command }, index) => {
    const { name, imageName, logo, platforms } = dockerConfigs[implementation];
    if (!platforms.includes(currPlatform)) return;
    managedNodes.push({ index, name, imageName, logo, implementation, version, command });
  });

  return (
    <>
      <Styled.Table
        dataSource={managedNodes}
        title={() => l('title')}
        pagination={false}
        rowKey="index"
      >
        <Table.Column
          title={l('implementation')}
          dataIndex="name"
          render={(name: string, node: ManagedNodeView) => (
            <span key="name">
              <Styled.Logo src={node.logo} />
              {name}
            </span>
          )}
        />
        <Table.Column title={l('dockerImage')} dataIndex="imageName" />
        <Table.Column title={l('version')} dataIndex="version" />
        <Table.Column
          title={l('command')}
          dataIndex="command"
          ellipsis
          render={cmd => (cmd ? cmd : <Tag>default</Tag>)}
        />
        <Table.Column
          title={l('manage')}
          width={150}
          align="right"
          render={(_, node: ManagedNodeView) => (
            <Button
              type="link"
              icon={<FormOutlined />}
              onClick={() => handleCustomize(node)}
            >
              {l('edit')}
            </Button>
          )}
        />
      </Styled.Table>
      {editingNode && (
        <ManagedNodeModal node={editingNode} onClose={() => setEditingNode(undefined)} />
      )}
    </>
  );
};

export default ManagedNodesTable;
