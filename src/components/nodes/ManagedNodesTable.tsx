import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Table } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { ManagedNode } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';

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

interface NodeInfo {
  index: number;
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

  const handleCustomize = (node: NodeInfo) => {
    console.warn(node);
  };

  const managedNodes: NodeInfo[] = [];
  nodes.forEach(({ implementation, version, command }, index) => {
    const { name, imageName, logo, platforms } = dockerConfigs[implementation];
    if (!platforms.includes(currPlatform)) return;
    managedNodes.push({ index, name, imageName, logo, version, command });
  });

  return (
    <Styled.Table
      dataSource={managedNodes}
      title={() => l('title')}
      pagination={false}
      rowKey="index"
    >
      <Table.Column
        title={l('implementation')}
        dataIndex="name"
        render={(name: string, node: NodeInfo) => (
          <span key="name">
            <Styled.Logo src={node.logo} />
            {name}
          </span>
        )}
      />
      <Table.Column title={l('dockerImage')} dataIndex="imageName" />
      <Table.Column title={l('version')} dataIndex="version" />
      <Table.Column
        title=""
        width={150}
        align="right"
        render={(_, node: NodeInfo) => (
          <Button
            type="link"
            icon={<FormOutlined />}
            onClick={() => handleCustomize(node)}
          >
            {l('customize')}
          </Button>
        )}
      />
    </Styled.Table>
  );
};

export default ManagedNodesTable;
