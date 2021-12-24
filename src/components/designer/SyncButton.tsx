import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions } from 'store';
import { Network } from 'types';

interface Props {
  network: Network;
}

const SyncButton: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.SyncButton');
  const { notify } = useStoreActions(s => s.app);
  const { syncChart } = useStoreActions(s => s.designer);
  const syncChartAsync = useAsyncCallback(async () => {
    try {
      await syncChart(network);
      notify({
        message: l('syncSuccess'),
      });
    } catch (error: any) {
      notify({
        message: l('syncError'),
        error,
      });
    }
  });
  return (
    <Tooltip title={l('syncBtnTip')}>
      <Button
        icon={<ReloadOutlined />}
        disabled={network.status !== Status.Started}
        onClick={syncChartAsync.execute}
        loading={syncChartAsync.loading}
      />
    </Tooltip>
  );
};

export default SyncButton;
