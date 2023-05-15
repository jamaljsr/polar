import React, { useEffect, useState } from 'react';
import { Form } from 'antd';
import Select, { SelectProps, SelectValue } from 'antd/lib/select';
import { TapNode } from 'shared/types';
import * as PTAP from 'lib/tap/types';
import { useStoreState } from 'store';
import { TapNodeModel } from 'store/models/tap';

type TapModelData = PTAP.TapAsset | PTAP.TapBalance;

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  help?: string;
  tapNetworkNodes: TapNode[];
  selectBalances?: boolean;
  onChange?: (option: any) => void;
}

const TapDataSelect: React.FC<Props> = ({
  name,
  label,
  help,
  tapNetworkNodes,
  selectBalances,
  onChange,
  ...rest
}) => {
  //store state
  const { nodes } = useStoreState(s => s.tap);

  //component state
  const [tapOptions, setTapOptions] = useState<any>([]);

  //component methods
  const handleChange = (value: SelectValue, option: any) => {
    if (onChange) onChange(option as TapModelData);
  };

  useEffect(() => {
    const resourceKey = (selectBalances ? 'balances' : 'assets') as keyof TapNodeModel;
    const data = tapNetworkNodes.map((tapNetworkNode: TapNode, i: number) => {
      const node: TapNodeModel = nodes[tapNetworkNode.name];
      if (node) {
        const data: TapModelData[] = node[resourceKey] as TapModelData[];
        if (data && data.length > 0) {
          return {
            label: tapNetworkNode.name,
            options: data.map((tapData: TapModelData) => ({
              label: tapData.name,
              value: `${tapData.name}-${i}`,
              ...tapData,
            })),
          };
        }
      }
      return {};
    });
    setTapOptions(data);
  }, [nodes]);

  return (
    <Form.Item name={name} label={label} help={help}>
      {tapOptions && <Select {...rest} onChange={handleChange} options={tapOptions} />}
    </Form.Item>
  );
};

export default TapDataSelect;
