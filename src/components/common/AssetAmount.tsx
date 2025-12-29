import React, { useMemo } from 'react';
import { useStoreState } from 'store';

interface Props {
  assetId: string;
  amount: string;
  includeName?: boolean;
}

const AssetAmount: React.FC<Props> = ({ assetId, amount, includeName }) => {
  const formatAssetAmount = useStoreState(s => s.tap.formatAssetAmount);

  const formattedAmount = useMemo(() => {
    return formatAssetAmount({ assetId, amount, includeName });
  }, [formatAssetAmount, assetId, amount, includeName]);

  return <span>{formattedAmount}</span>;
};

export default AssetAmount;
