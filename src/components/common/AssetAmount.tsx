import React, { useMemo } from 'react';
import { useStoreActions } from 'store';

interface Props {
  assetId: string;
  amount: string;
  includeName?: boolean;
}

const AssetAmount: React.FC<Props> = ({ assetId, amount, includeName }) => {
  const { formatAssetAmount } = useStoreActions(s => s.tap);

  const formattedAmount = useMemo(() => {
    return formatAssetAmount({ assetId, amount, includeName });
  }, [assetId, amount, includeName]);

  return <span>{formattedAmount}</span>;
};

export default AssetAmount;
