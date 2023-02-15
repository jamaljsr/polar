import React from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

interface Props {
  taroName: string;
  lndName: string;
  type?: 'button' | 'menu';
  disabled?: boolean;
}

const ChangeTaroBackendButton: React.FC<Props> = ({
  taroName,
  lndName,
  type,
  disabled,
}) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.ChangeBackendButton');

  const { showChangeTaroBackend } = useStoreActions(s => s.modals);
  const handleChangeClick = () => {
    showChangeTaroBackend({ taroName, lndName });
  };

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
