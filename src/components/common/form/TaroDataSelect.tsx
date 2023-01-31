import React, { useEffect, useState } from 'react';
import { Form } from 'antd';
import Select, { SelectProps, SelectValue } from 'antd/lib/select';
import { TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { useStoreState } from 'store';
import { TaroNodeModel } from 'store/models/taro';

type TaroModelData = PTARO.TaroAsset | PTARO.TaroBalance;
const cantorPairing = (a: number, b: number): number => {
  a += 1;
  b += 1;
  return ((a + b) * (a + b + 1)) / 2 + a;
};

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  help?: string;
  taroNetworkNodes: TaroNode[];
  selectBalances?: boolean;
}

const TaroDataSelect: React.FC<Props> = ({
  name,
  label,
  help,
  taroNetworkNodes,
  selectBalances,
  onChange,
  ...rest
}) => {
  //store state
  const { nodes } = useStoreState(s => s.taro);

  //component state
  const [taroOptions, setTaroOptions] = useState<any>([]);

  //component methods
  const handleChange = (value: SelectValue, option: any) => {
    if (onChange) onChange(option, option);
  };

  useEffect(() => {
    const resourceKey = (selectBalances ? 'balances' : 'assets') as keyof TaroNodeModel;
    const data = taroNetworkNodes.map((taroNetworkNode: TaroNode, i) => {
      const node: TaroNodeModel = nodes[taroNetworkNode.name];
      if (node) {
        const data: TaroModelData[] = node[resourceKey] as TaroModelData[];
        if (data) {
          return {
            label: taroNetworkNode.name,
            options: data.map((taroData: TaroModelData, j: number) => ({
              label: taroData.name,
              value: `${taroData.name}-${i}`,
              key: cantorPairing(i, j),
              ...taroData,
            })),
          };
        }
      }
      return {};
    });
    setTaroOptions(data);
  }, [nodes]);

  return (
    <Form.Item name={name} label={label} help={help}>
      {taroOptions && <Select {...rest} onChange={handleChange} options={taroOptions} />}
    </Form.Item>
  );
};

export default TaroDataSelect;
