import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { FileTextOutlined } from '@ant-design/icons';
import { Button, Form, message } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { AnyNode } from 'shared/types';
import { useStoreActions } from 'store';
import { getContainerName } from 'utils/network';
import { LOGS } from 'components/routing';

interface Props {
  node: AnyNode;
  type?: 'button' | 'menu';
}

const ViewLogsButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.dockerLogs.ViewLogsButton');
  const { openWindow } = useStoreActions(s => s.app);
  const openAsync = useAsyncCallback(async () => {
    if (type === 'menu') message.info(l('openMsg'));
    await openWindow(LOGS(node.implementation, getContainerName(node)));
  });

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={openAsync.execute}>
        <FileTextOutlined />
        <span>{l('btn')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        icon={<FileTextOutlined />}
        block
        loading={openAsync.loading}
        onClick={openAsync.execute}
      >
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default ViewLogsButton;
