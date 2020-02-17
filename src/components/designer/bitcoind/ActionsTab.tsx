import React from 'react';
import styled from '@emotion/styled';
import { Form } from 'antd';
import { BitcoinNode, Status } from 'shared/types';
import { AdvancedOptionsButton, RestartNode } from 'components/common';
import { OpenTerminalButton } from 'components/terminal';
import MineBlocksInput from './actions/MineBlocksInput';
import RemoveNode from './actions/RemoveNode';

const Styled = {
  Spacer: styled.div`
    height: 48px;
  `,
};

interface Props {
  node: BitcoinNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  return (
    <Form wrapperCol={{ span: 24 }}>
      {node.status === Status.Started && (
        <>
          <MineBlocksInput node={node} />
          <OpenTerminalButton node={node} />
          <Styled.Spacer />
        </>
      )}
      <RestartNode node={node} />
      <AdvancedOptionsButton node={node} />
      <RemoveNode node={node} />
    </Form>
  );
};

export default ActionsTab;
