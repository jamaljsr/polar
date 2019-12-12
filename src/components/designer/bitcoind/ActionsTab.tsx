import React from 'react';
import styled from '@emotion/styled';
import { BitcoinNode, Status } from 'shared/types';
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
    <>
      {node.status === Status.Started && (
        <>
          <MineBlocksInput node={node} />
          <OpenTerminalButton node={node} />
          <Styled.Spacer />
        </>
      )}
      <RemoveNode node={node} />
    </>
  );
};

export default ActionsTab;
