import React from 'react';
import styled from '@emotion/styled';
import { LightningNode, Status } from 'shared/types';
import { OpenTerminalButton } from 'components/terminal';
import { Deposit, OpenChannelButtons, RemoveNode } from './actions';

const Styled = {
  Spacer: styled.div`
    height: 48px;
  `,
};

interface Props {
  node: LightningNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  return (
    <>
      {node.status === Status.Started && (
        <>
          <Deposit node={node} />
          <OpenChannelButtons node={node} />
          <OpenTerminalButton node={node} />
          <Styled.Spacer />
        </>
      )}
      <RemoveNode node={node} />
    </>
  );
};

export default ActionsTab;
