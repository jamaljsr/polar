import styled from '@emotion/styled';
import { Form } from 'antd';
import {
  AdvancedOptionsButton,
  RemoveNode,
  RenameNodeButton,
  RestartNode,
} from 'components/common';
import { ViewLogsButton } from 'components/dockerLogs';
import { OpenTerminalButton } from 'components/terminal';
import React from 'react';
import { ArkNode, Status } from 'shared/types';

const Styled = {
  Spacer: styled.div`
    height: 48px;
  `,
};

interface Props {
  node: ArkNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  return (
    <Form labelCol={{ span: 24 }}>
      {node.status === Status.Started && (
        <>
          <p>TODO</p>
          <Styled.Spacer />

          <OpenTerminalButton node={node} />
          <ViewLogsButton node={node} />
          <Styled.Spacer />
        </>
      )}
      <RestartNode node={node} />
      <RenameNodeButton node={node} />
      <AdvancedOptionsButton node={node} />
      <RemoveNode node={node} />
    </Form>
  );
};

export default ActionsTab;
