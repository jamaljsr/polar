import React from 'react';
import styled from '@emotion/styled';
import { Form } from 'antd';
import { Status, TaroNode } from 'shared/types';
import { AdvancedOptionsButton, RemoveNode, RestartNode } from 'components/common';
import { ViewLogsButton } from 'components/dockerLogs';
import { OpenTerminalButton } from 'components/terminal';
import { MintAssetButton, NewAddressButton } from './actions';

const Styled = {
  Spacer: styled.div`
    height: 48px;
  `,
};

interface Props {
  node: TaroNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  return (
    <Form labelCol={{ span: 24 }}>
      {node.status === Status.Started && (
        <>
          <>
            <MintAssetButton node={node} />
            <NewAddressButton node={node} />
            <Styled.Spacer />
          </>

          <OpenTerminalButton node={node} />
          <ViewLogsButton node={node} />
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
