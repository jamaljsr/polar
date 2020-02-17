import React from 'react';
import { AlignLeftOutlined, StopOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form, Input, Tooltip } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';

const Styled = {
  CommandLabel: styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    span:first-of-type {
      width: 75%;
    }
  `,
  CommandHelp: styled.div`
    margin-top: 5px;
    opacity: 0.45;
  `,
};

interface Props {
  form: FormInstance;
  name: string;
  defaultCommand?: string;
  disabled?: boolean;
}

const DockerCommandInput: React.FC<Props> = ({
  form,
  name,
  defaultCommand,
  disabled,
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.DockerCommandInput');
  const prefillCommand = () => form.setFieldsValue({ command: defaultCommand || '' });
  const clearCommand = () => form.setFieldsValue({ command: '' });
  const labelCmp = (
    <Styled.CommandLabel>
      <span>{l('help')}</span>
      <span>
        <Tooltip placement="topLeft" arrowPointAtCenter title={l('prefillTip')}>
          <Button type="link" icon={<AlignLeftOutlined />} onClick={prefillCommand} />
        </Tooltip>
        <Tooltip placement="topLeft" arrowPointAtCenter title={l('removeTip')}>
          <Button type="link" icon={<StopOutlined />} onClick={clearCommand} />
        </Tooltip>
      </span>
    </Styled.CommandLabel>
  );
  return (
    <Form.Item name={name} label={l('label')} extra={labelCmp}>
      <Input.TextArea
        rows={6}
        disabled={disabled}
        autoSize={{ minRows: 2, maxRows: 6 }}
      />
    </Form.Item>
  );
};

export default DockerCommandInput;
