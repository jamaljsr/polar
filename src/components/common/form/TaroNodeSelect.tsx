import React, { useMemo, useState } from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { Network } from 'types';
import { format } from 'utils/units';
import { TaroNodeModel } from 'store/models/taro';
import { CommonNode } from 'shared/types';

export interface Props extends SelectProps<SelectValue> {
  network: Network;
  name: string;
  label?: string;
  nodeStatus?: Status;
  initialValue?: string;
  nodes?: {
    [key: string]: TaroNodeModel;
  };
  networkNodes?: CommonNode[];
}

const TaroNodeSelect: React.FC<Props> = ({
  network,
  name,
  label,
  nodeStatus,
  initialValue,
  nodes,
  networkNodes,
  onChange,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.TaroNodeSelect');
  const [help, setHelp] = useState<string>();
  const [selected, setSelected] = useState(initialValue || '');

  // useMemo(() => {
  //     if (nodes && nodes[selected] && nodes[selected].walletBalance) {
  //         setHelp(`${l('balance')}: ${format(nodes[selected].walletBalance)} sats`);
  //     } else {
  //         setHelp('');
  //     }
  // }
  // , [selected, nodes, l]);

  const handleChange = (value: SelectValue, option: any) => {
    setSelected(`${value}`);
    if (onChange) onChange(value, option);
  };

  if (nodeStatus !== undefined && networkNodes) {
    networkNodes = networkNodes.filter(n => n.status === nodeStatus);
  }

  return (
    <Form.Item
      name={name}
      label={label}
      extra={help}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
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
