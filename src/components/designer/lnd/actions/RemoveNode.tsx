import React from 'react';
import styled from '@emotion/styled';
import { Button, Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LndNode } from 'shared/types';
import { useStoreActions } from 'store';

const Styled = {
  FormItem: styled(Form.Item)`
    margin-top: 48px;
  `,
};

interface Props {
  node: LndNode;
}

const RemoveNode: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.actions.RemoveNode');
  const { notify } = useStoreActions(s => s.app);

  const showRemoveModal = () => {
    const { name } = node;
    Modal.confirm({
      title: l('confirmText', { name }),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          // await closeChannel({ node: from as LndNode, channelPoint });
          notify({ message: l('success', { name }) });
        } catch (error) {
          notify({ message: l('error'), error });
          throw error;
        }
      },
    });
  };

  return (
    <Styled.FormItem label={l('title')}>
      <Button type="danger" block ghost onClick={showRemoveModal}>
        {l('btnText')}
      </Button>
    </Styled.FormItem>
  );
};

export default RemoveNode;
