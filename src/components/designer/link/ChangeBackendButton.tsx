import React from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

interface Props {
  lnName: string;
  backendName: string;
  type?: 'button' | 'menu';
}

const ChangeBackendButton: React.FC<Props> = ({ lnName, backendName, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.ChangeBackendButton');

  const { showChangeBackend } = useStoreActions(s => s.modals);
  const handleChangeClick = () => {
    showChangeBackend({ lnName, backendName });
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

export default ChangeBackendButton;
