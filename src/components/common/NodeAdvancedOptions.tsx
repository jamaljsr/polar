import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Button, Collapse, Form, Input } from 'antd';
import { CommonNode } from 'shared/types';
import { useStoreActions } from 'store';
import { dockerConfigs } from 'utils/constants';

const Styled = {
  Collapse: styled(Collapse)`
    margin: 0 -24px;
  `,
};

interface Props {
  node: CommonNode;
  onUpdate: (command: string) => Promise<void>;
}

const NodeAdvancedOptions: React.FC<Props> = ({ node, onUpdate }) => {
  const { notify } = useStoreActions(s => s.app);
  const [command, setCommand] = useState(node.docker.command);
  const updateAsync = useAsyncCallback(async () => {
    try {
      await onUpdate(command);
      notify({ message: `Updated advanced options for ${node.name}` });
    } catch (error) {
      notify({ message: 'Unable to update options', error });
    }
  });
  const defaultComand = dockerConfigs.LND.command;

  return (
    <Form layout="vertical">
      <Styled.Collapse bordered={false}>
        <Collapse.Panel key="advanced" header="Advanced Options">
          <Form.Item name="command" label="Startup Command">
            <Input.TextArea
              rows={6}
              value={command}
              placeholder={defaultComand}
              disabled={updateAsync.loading}
              onChange={e => setCommand(e.target.value)}
            />
          </Form.Item>
          <Button
            type="primary"
            block
            onClick={updateAsync.execute}
            disabled={updateAsync.loading}
          >
            Update
          </Button>
        </Collapse.Panel>
      </Styled.Collapse>
    </Form>
  );
};

export default NodeAdvancedOptions;
