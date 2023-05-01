import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { ReloadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { Network } from 'types';

const Styled = {
  Button: styled(Button)`
    margin-left: 8px;
    font-size: 18px;
    padding: 2px 0 !important;
  `,
};

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
      <Styled.Button
        icon={<ReloadOutlined />}
        onClick={syncChartAsync.execute}
        loading={syncChartAsync.loading}
      />
    </Tooltip>
  );
};

export default SyncButton;
