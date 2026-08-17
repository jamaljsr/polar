import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { ExportOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: LightningNode;
  type?: 'button' | 'menu';
}

const ExportChannelBackupButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.ExportChannelBackupButton',
  );
  const { notify } = useStoreActions(s => s.app);
  const { exportChannelBackup } = useStoreActions(s => s.lightning);
  const exportAsync = useAsyncCallback(async () => {
    try {
      const filePath = await exportChannelBackup(node);
      // filePath is undefined if the user aborts the save dialog
      if (filePath) {
        notify({ message: l('exportSuccess', { name: node.name }) });
      }
    } catch (error: any) {
      notify({ message: l('exportError'), error });
    }
  });

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={exportAsync.execute}>
        <ExportOutlined />
        <span>{l('menu')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        icon={<ExportOutlined />}
        block
        loading={exportAsync.loading}
        onClick={exportAsync.execute}
      >
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default ExportChannelBackupButton;
