import React from 'react';
import { AlignLeftOutlined, StopOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Input, Tooltip } from 'antd';

const Styled = {
  CommandLabel: styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  `,
  CommandHelp: styled.div`
    margin-top: 5px;
    opacity: 0.45;
  `,
};

interface Props {
  value: string;
  defaultCommand: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DockerCommandInput: React.FC<Props> = ({
  value,
  defaultCommand,
  onChange,
  disabled,
}) => {
  const prefillCommand = () => onChange(defaultCommand);
  const clearCommand = () => onChange('');
  return (
    <>
      <Styled.CommandLabel>
        <span>Docker Startup Command</span>
        <span>
          <Tooltip
            placement="topLeft"
            arrowPointAtCenter
            title="Pre-fill with default command"
          >
            <Button type="link" icon={<AlignLeftOutlined />} onClick={prefillCommand} />
          </Tooltip>
          <Tooltip placement="topLeft" arrowPointAtCenter title="Remove Custom Command">
            <Button type="link" icon={<StopOutlined />} onClick={clearCommand} />
          </Tooltip>
        </span>
      </Styled.CommandLabel>
      <Input.TextArea
        rows={6}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 6 }}
      />
      <Styled.CommandHelp>
        The docker command to execute when starting this node. If left blank, the default
        command will be used.
      </Styled.CommandHelp>
    </>
  );
};

export default DockerCommandInput;
