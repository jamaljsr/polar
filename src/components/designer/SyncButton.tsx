import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Button, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { Network, Status } from 'types';

interface Props {
  network: Network;
}

const SyncButton: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.SyncButton');
  const { notify } = useStoreActions(s => s.app);
  const { syncChart, redrawChart } = useStoreActions(s => s.designer);
  const syncChartAsync = useAsyncCallback(async () => {
    try {
      await syncChart(network);
      redrawChart();
      notify({
        message: l('syncSuccess'),
      });
    } catch (error) {
      notify({
        message: l('syncError'),
        error,
      });
    }
  });
  return (
    <Tooltip title={l('syncBtnTip')}>
      <Button
        icon="reload"
        disabled={network.status !== Status.Started}
        onClick={syncChartAsync.execute}
        loading={syncChartAsync.loading}
      />
    </Tooltip>
  );
};

export default SyncButton;
