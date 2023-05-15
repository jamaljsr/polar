import React from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TapdNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { exists } from 'utils/files';

interface Props {
  tapName: string;
  lndName: string;
  type?: 'button' | 'menu';
}

const ChangeTapBackendButton: React.FC<Props> = ({ tapName, lndName, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.ChangeTapBackendButton');

  const { showChangeTapBackend } = useStoreActions(s => s.modals);
  const { activeId } = useStoreState(s => s.designer);
  const { notify } = useStoreActions(s => s.app);

  const networks = useStoreState(s => s.network.networks);
  const network = networks.find(n => n.id === activeId) as Network;

  const handleChangeClick = async () => {
    const tapNode = network.nodes.tap.find(n => n.name === tapName) as TapdNode;
    const hasMacaron = await exists(tapNode.paths.adminMacaroon);
    if (hasMacaron) {
      notify({ message: l('error'), error: new Error(l('hasMacaroonErr')) });
    } else if (network.status !== Status.Stopped) {
      notify({
        message: l('error'),
        error: new Error(l('networkNotStoppedErr', { tapName })),
      });
    } else {
      showChangeTapBackend({ tapName, lndName });
    }
  };

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

export default ChangeTapBackendButton;
