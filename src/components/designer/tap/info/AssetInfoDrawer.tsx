import React, { ReactNode, useMemo } from 'react';
import styled from '@emotion/styled';
import { Divider, Drawer, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TapAsset, TapBalance } from 'lib/tap/types';
import { useStoreActions, useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { CopyIcon } from 'components/common';
import AssetAmount from 'components/common/AssetAmount';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

const Styled = {
  DetailsList: styled(DetailsList)`
    margin: 0 0 10px 0;
  `,
};

/** A helper hook to query the info of a specific TAP asset from the store */
const useAssetState = (nodeName?: string, assetId?: string) => {
  const { nodes } = useStoreState(s => s.tap);
  return useMemo(() => {
    const result: { assets: TapAsset[]; balance?: TapBalance } = {
      assets: [],
    };
    if (!nodeName) return result;
    const nodeState = nodes[nodeName];
    if (nodeState.assets?.length) {
      result.assets = nodeState.assets.filter(a => a.id === assetId);
    }
    if (nodeState.balances?.length) {
      result.balance = nodeState.balances.find(b => b.id === assetId);
    }
    return result;
  }, [nodes, assetId, nodeName]);
};

const DetailValue: React.FC<{ value: string }> = ({ value }) => {
  return (
    <CopyIcon
      value={value}
      text={<Tooltip overlay={value}>{ellipseInner(value)}</Tooltip>}
    />
  );
};

const AssetInfoDrawer: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.info.AssetInfoDrawer');
  const { visible, assetId, nodeName } = useStoreState(s => s.modals.assetInfo);
  const { hideAssetInfo } = useStoreActions(s => s.modals);
  const { assets, balance } = useAssetState(nodeName, assetId);

  let cmp: ReactNode = undefined;
  if (balance) {
    const assetDetails: DetailValues = [
      {
        label: l('balance'),
        value: <AssetAmount assetId={balance.id} amount={balance.balance} />,
      },
      { label: l('type'), value: balance.type },
      { label: l('assetId'), value: <DetailValue value={balance.id} /> },
      { label: l('genesisPoint'), value: <DetailValue value={balance.genesisPoint} /> },
    ];
    if (assets.length > 0) {
      assetDetails.push({ label: l('decimals'), value: assets[0].decimals });

      if (assets[0].groupKey) {
        assetDetails.push({ label: l('emission'), value: 'True' });
        assetDetails.push({
          label: l('groupKey'),
          value: <DetailValue value={assets[0].groupKey} />,
        });
      } else {
        assetDetails.push({ label: l('emission'), value: 'False' });
      }
    }
    const utxoDetails: DetailValues = assets.map(a => ({
      label: <AssetAmount assetId={a.id} amount={a.amount} includeName />,
      value: <DetailValue value={a.anchorOutpoint} />,
    }));
    cmp = (
      <>
        <h2>{balance.name}</h2>
        <Styled.DetailsList details={assetDetails} />
        <Divider>{l('utxos')}</Divider>
        <DetailsList details={utxoDetails} />
      </>
    );
  } else {
    cmp = <p>{l('notFound', { assetId })}</p>;
  }

  return (
    <Drawer
      title={l('title')}
      open={visible}
      onClose={() => hideAssetInfo()}
      destroyOnClose
    >
      {cmp}
    </Drawer>
  );
};

export default AssetInfoDrawer;
