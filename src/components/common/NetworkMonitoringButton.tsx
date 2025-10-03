import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    margin-left: 8px;
  `,
};

interface Props {
  networkId: number;
}

const NetworkMonitoringButton: React.FC<Props> = ({ networkId }) => {
  const { l } = usePrefixedTranslation('cmps.network.NetworkActions');
  const { showNetworkMonitoring } = useStoreActions(s => s.modals);

  const showModal = async () => {
    await showNetworkMonitoring({ networkId });
  };

  return (
    <Tooltip title={l('monitorBtn') || 'Monitor Network'}>
      <Styled.Button onClick={showModal} role="monitor-network">
        <EyeOutlined />
      </Styled.Button>
    </Tooltip>
  );
};

export default NetworkMonitoringButton;
