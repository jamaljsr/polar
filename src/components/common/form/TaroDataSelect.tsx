import React, { useEffect, useState } from 'react';
import { Form } from 'antd';
import Select, { SelectProps, SelectValue } from 'antd/lib/select';
import { TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { useStoreState } from 'store';

type TaroData = PTARO.TaroAsset | PTARO.TaroBalance;
type TaroDataMapping = {
  [key: string]: TaroData[];
};

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
  console.log(nodes);
  console.log(taroNetworkNodes);

  //component state
  const [taroData, setTaroData] = useState<TaroDataMapping>({});

  //component methods
  const handleChange = (value: SelectValue, option: any) => {
    const data: any = taroData[option.taroNode]?.[option.dataIndex];
    if (onChange && data) onChange(data, option);
  };

  useEffect(() => {
    const data = taroNetworkNodes.reduce(
      (taroDataMap: TaroDataMapping, taroNetworkNode: TaroNode) => {
        if (nodes[taroNetworkNode.name]) {
          const balancesOrAssets = selectBalances
            ? nodes[taroNetworkNode.name].balances
            : nodes[taroNetworkNode.name].assets;
          if (balancesOrAssets) {
            taroDataMap[taroNetworkNode.name] = balancesOrAssets;
          }
        }
        return taroDataMap;
      },
      {} as TaroDataMapping,
    );
    console.log(JSON.stringify(data));
    setTaroData(data);
  }, [nodes]);

  return (
    <Form.Item name={name} label={label} help={help}>
      {taroData && (
        <Select
          {...rest}
          onChange={handleChange}
          options={Object.entries(taroData).map(([taroNode, data], i) => {
            return {
              label: taroNode,
              options: data.map((taroData: TaroData, j: number) => ({
                value: `${taroData.name}-${i}`,
                taroNode,
                dataIndex: j,
                key: cantorPairing(i, j),
              })),
            };
          })}
        />
      )}
    </Form.Item>
  );
};

export default TaroDataSelect;
