import React, { useEffect } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TarodNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { exists } from 'utils/files';

interface Props {
  taroName: string;
  lndName: string;
  type?: 'button' | 'menu';
}

const ChangeTaroBackendButton: React.FC<Props> = ({ taroName, lndName, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.ChangeTaroBackendButton');

  const { showChangeTaroBackend } = useStoreActions(s => s.modals);
  const { activeId } = useStoreState(s => s.designer);
  const { notify } = useStoreActions(s => s.app);

  const networks = useStoreState(s => s.network.networks);
  const network = networks.find(n => n.id === activeId) as Network;

  const [hasMacaron, setHasMacaroon] = React.useState(false);

  const handleChangeClick = () => {
    if (hasMacaron) {
      notify({ message: l('error'), error: new Error(l('hasMacaroonErr')) });
    } else if (network.status !== Status.Stopped) {
      notify({
        message: l('error'),
        error: new Error(l('networkNotStoppedErr', { taroName })),
      });
    } else {
      showChangeTaroBackend({ taroName, lndName });
    }
  };

  useEffect(() => {
    (async () => {
      const taroNode = network.nodes.taro.find(n => n.name === taroName) as TarodNode;
      const result = await exists(taroNode.paths.adminMacaroon);
      setHasMacaroon(result);
    })();
  });

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={handleChangeClick}>
        <ApiOutlined />
        <span>{l('btnText')}</span>
      </div>
    );
  }

  return (
    <Button block onClick={handleChangeClick}>
      <ApiOutlined />
      {l('btnText')}
    </Button>
  );
};

export default ChangeTaroBackendButton;
