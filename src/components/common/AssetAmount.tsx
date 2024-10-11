import React, { useMemo } from 'react';
import { useStoreState } from 'store';
import { formatDecimals } from 'utils/numbers';

interface Props {
  assetId: string;
  amount: string;
  includeName?: boolean;
}

const AssetAmount: React.FC<Props> = ({ assetId, amount, includeName }) => {
  const { nodes } = useStoreState(s => s.tap);

  const formattedAmount = useMemo(() => {
    for (const node of Object.values(nodes)) {
      const asset = node.assets?.find(a => a.id === assetId);
      if (asset) {
        const amt = formatDecimals(Number(amount) / 10 ** asset.decimals, asset.decimals);
        if (includeName) {
          return `${amt} ${asset.name}`;
        }
        return amt;
      }
    }
    return amount;
  }, [nodes, assetId, amount, includeName]);

  return <span>{formattedAmount}</span>;
};

export default AssetAmount;
