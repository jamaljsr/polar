import React from 'react';
import { Alert } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { CopyIcon, DetailsList, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: BitcoinNode;
}

const InfoTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.InfoTab');
  const { chainInfo, walletInfo } = useStoreState(s => s.bitcoind);
  const details: DetailValues = [
    { label: l('nodeType'), value: node.type },
    { label: l('implementation'), value: node.implementation },
    { label: l('version'), value: `v${node.version}` },
    {
      label: l('status'),
      value: (
        <StatusBadge
          status={node.status}
          text={l(`enums.status.${Status[node.status]}`)}
        />
      ),
    },
  ];

  if (node.status === Status.Started && chainInfo && walletInfo) {
    details.push(
      { label: l('spendableBalance'), value: `${walletInfo.balance} BTC` },
      { label: l('immatureBalance'), value: `${walletInfo.immature_balance} BTC` },
      { label: l('blockHeight'), value: chainInfo.blocks },
      {
        label: l('blockHash'),
        value: (
          <CopyIcon
            label={l('blockHash')}
            value={chainInfo.bestblockhash}
            text={ellipseInner(chainInfo.bestblockhash)}
          />
        ),
      },
    );
  }

  return (
    <>
      {node.status === Status.Error && node.errorMsg && (
        <Alert
          type="error"
          message={l('startError')}
          description={node.errorMsg}
          closable={false}
          showIcon
        />
      )}
      <DetailsList details={details} />
    </>
  );
};

export default InfoTab;
