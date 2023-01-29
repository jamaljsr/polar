import React from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { CommonNode, Status } from 'shared/types';

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  help?: string;
  nodeStatus?: Status;
  networkNodes?: CommonNode[];
}

const TaroNodeSelect: React.FC<Props> = ({
  name,
  label,
  help,
  nodeStatus,
  networkNodes,
  onChange,
  ...rest
}) => {
  const handleChange = (value: SelectValue, option: any) => {
    if (onChange) onChange(value, option);
  };

  if (nodeStatus !== undefined && networkNodes) {
    networkNodes = networkNodes.filter(n => n.status === nodeStatus);
  }

  return (
    <Form.Item name={name} label={label} help={help}>
      <Select {...rest} onChange={handleChange}>
        {networkNodes &&
          networkNodes.map(n => (
            <Select.Option key={n.name} value={n.name}>
              {n.name}
            </Select.Option>
          ))}
      </Select>
    </Form.Item>
  );
};

export default TaroNodeSelect;
