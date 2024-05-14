import React from 'react';
import { Button, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LitdNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: LitdNode;
  localPublicKey: string;
}

const LncRevokeButton: React.FC<Props> = ({ node, localPublicKey }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.connect.LncRevokeButton');
  const { notify } = useStoreActions(s => s.app);
  const { hideLncSessionInfo } = useStoreActions(s => s.modals);
  const { getSessions, revokeSession } = useStoreActions(s => s.lit);

  const showCloseChanModal = () => {
    Modal.confirm({
      title: l('title'),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          await revokeSession({ node, localPublicKey });
          await getSessions(node);
          await hideLncSessionInfo();
          notify({ message: l('success') });
        } catch (error: any) {
          notify({ message: l('error'), error });
        }
      },
    });
  };

  return (
    <Button type="default" danger block onClick={showCloseChanModal}>
      {l('btnText')}
    </Button>
  );
};

export default LncRevokeButton;
