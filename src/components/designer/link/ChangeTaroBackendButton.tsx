import React from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

interface Props {
  taroName: string;
  lndName: string;
  type?: 'button' | 'menu';
}

const ChangeTaroBackendButton: React.FC<Props> = ({ taroName, lndName, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.ChangeBackendButton');

  const { showChangeTaroBackend } = useStoreActions(s => s.modals);
  const handleChangeClick = () => {
    showChangeTaroBackend({ taroName, lndName });
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

export default ChangeTaroBackendButton;
