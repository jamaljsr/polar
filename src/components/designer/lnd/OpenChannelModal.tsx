import React, { useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { Modal } from 'antd';
import { Network } from 'types';

const Styled = {
  OpenChannelModal: styled.div``,
};

interface Props {
  network: Network;
  from?: string;
  to?: string;
  visible?: boolean;
  onClose?: () => void;
}

export const useOpenChannelModal = (network: Network) => {
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const show = useCallback((args: { to?: string; from?: string }) => {
    setTo(args.to);
    setFrom(args.from);
    setVisible(true);
  }, []);
  const onClose = useCallback(() => setVisible(false), []);

  return {
    network,
    show,
    visible,
    to,
    from,
    onClose,
  };
};

const OpenChannelModal: React.FC<Props> = ({ network, to, from, visible, onClose }) => {
  return (
    <Styled.OpenChannelModal>
      <Modal title="Open Channel" visible={visible} onCancel={onClose}>
        <p>To: {to}</p>
        <p>From: {from}</p>
        <p>Network: {network.name}</p>
      </Modal>
    </Styled.OpenChannelModal>
  );
};

export default OpenChannelModal;
