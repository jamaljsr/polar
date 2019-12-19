import React from 'react';
import styled from '@emotion/styled';
import { LightningNode, Status } from 'shared/types';
import { RestartNode } from 'components/common';
import { OpenTerminalButton } from 'components/terminal';
import { Deposit, OpenChannelButtons, PaymentButtons, RemoveNode } from './actions';

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
          <PaymentButtons node={node} />
          <OpenTerminalButton node={node} />
          <Styled.Spacer />
        </>
      )}
      <RestartNode node={node} />
      <RemoveNode node={node} />
    </>
  );
};

export default ActionsTab;
