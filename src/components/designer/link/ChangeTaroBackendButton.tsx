import React, { useEffect, useState } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';

interface Props {
  taroName: string;
  lndName: string;
  type?: 'button' | 'menu';
}

const ChangeTaroBackendButton: React.FC<Props> = ({ taroName, lndName, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.ChangeBackendButton');

  const { showChangeTaroBackend } = useStoreActions(s => s.modals);
  const { activeId } = useStoreState(s => s.designer);

  const networks = useStoreState(s => s.network.networks);
  const network = networks.find(n => n.id === activeId);

  const { nodes: taroNodes } = useStoreState(s => s.taro);

  const { getAssets } = useStoreActions(s => s.taro);
  const [isTaroStarted, setIsTaroStarted] = useState(false);

  useEffect(() => {
    if (network?.status !== Status.Started) return;
    const taroNode = network?.nodes.taro.find(n => n.name === taroName);
    if (!(taroNode && taroNode.status === Status.Started)) {
      setIsTaroStarted(false);
    } else {
      getAssets(taroNode);
      setIsTaroStarted(true);
    }
  }, [network?.status, network?.nodes.taro]);

  const handleChangeClick = () => {
    showChangeTaroBackend({ taroName, lndName });
  };
  const assets = taroNodes[taroName]?.assets || [];
  const hasAssets = assets.length > 0;
  const networkStopped = network?.status !== Status.Started;
  const disabled = networkStopped || !isTaroStarted || hasAssets;

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div
        style={disabled ? { pointerEvents: 'none', opacity: '0.4' } : {}}
        onClick={handleChangeClick}
      >
        <ApiOutlined />
        <span>{l('btnText')}</span>
      </div>
    );
  }

  return (
    <Button block onClick={handleChangeClick} disabled={disabled}>
      <ApiOutlined />
      {l('btnText')}
    </Button>
  );
};

export default ChangeTaroBackendButton;
