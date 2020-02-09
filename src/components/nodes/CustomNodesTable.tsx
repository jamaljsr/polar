import React from 'react';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Table } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CustomNode } from 'types';
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
  DeleteButton: styled(Button)`
    color: #a61d24;
    &:hover {
      color: #800f19;
    }
  `,
};

interface CustomNodeView {
  id: string;
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

  const handleEdit = (node: CustomNodeView) => {
    console.warn(node);
  };

  const handleDelete = (node: CustomNodeView) => {
    console.warn(node);
  };

  if (!nodes.length) {
    return null;
  }

  const customNodes: CustomNodeView[] = [];
  nodes.forEach(({ id, implementation, dockerImage, command }) => {
    const { name, logo, platforms } = dockerConfigs[implementation];
    if (!platforms.includes(currPlatform)) return;
    customNodes.push({ id, name, dockerImage, logo, command });
  });

  return (
    <Styled.Table
      dataSource={customNodes}
      title={() => l('title')}
      pagination={false}
      rowKey="id"
      emptyText={<>There are no custom images.</>}
    >
      <Table.Column
        title={l('implementation')}
        dataIndex="name"
        key="name"
        render={(name: string, node: CustomNodeView) => (
          <span key="name">
            <Styled.Logo src={node.logo} />
            {name}
          </span>
        )}
      />
      <Table.Column title={l('dockerImage')} dataIndex="dockerImage" key="imageName" />
      <Table.Column
        title={l('manage')}
        width={200}
        align="right"
        render={(_, node: CustomNodeView) => (
          <span key="edit">
            <Button type="link" icon={<FormOutlined />} onClick={() => handleEdit(node)}>
              {l('edit')}
            </Button>
            <Styled.DeleteButton
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(node)}
            ></Styled.DeleteButton>
          </span>
        )}
      />
    </Styled.Table>
  );
};

export default CustomNodesTable;
