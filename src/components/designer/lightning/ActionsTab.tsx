import React from 'react';
import styled from '@emotion/styled';
import { Form } from 'antd';
import { LightningNode, Status } from 'shared/types';
import {
  AdvancedOptionsButton,
  RemoveNode,
  RestartNode,
  RenameNode,
} from 'components/common';
import { ViewLogsButton } from 'components/dockerLogs';
import { OpenTerminalButton } from 'components/terminal';
import { Deposit, OpenChannelButtons, PaymentButtons } from './actions';

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
    <Form labelCol={{ span: 24 }}>
      {node.status === Status.Started && (
        <>
          <Deposit node={node} />
          <OpenChannelButtons node={node} />
          <PaymentButtons node={node} />
          <OpenTerminalButton node={node} />
          <ViewLogsButton node={node} />
          <Styled.Spacer />
        </>
      )}
      <RestartNode node={node} />
      <RenameNode node={node} />
      <AdvancedOptionsButton node={node} />
      <RemoveNode node={node} />
    </Form>
  );
};

export default ActionsTab;
