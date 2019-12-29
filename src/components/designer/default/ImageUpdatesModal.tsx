import React, { ReactNode } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Modal, Result } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { delay } from 'utils/async';
import { DetailsList, Loader } from 'components/common';

const Styled = {
  Loading: styled.div`
    min-height: 200px;
  `,
  Details: styled.div`
    width: 70%;
    margin: auto;
  `,
};

interface Props {
  onClose: () => void;
}

const ImageUpdatesModal: React.FC<Props> = ({ onClose }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.ImageUpdatesModal');
  const { notify } = useStoreActions(s => s.app);

  const checkAsync = useAsync(async () => {
    await delay(1000);
    return true;
  }, []);

  const updateAsync = useAsyncCallback(async () => {
    try {
      await delay(1000);
      onClose();
      notify({ message: l('addSuccess') });
    } catch (error) {
      notify({ message: l('addError'), error });
    }
  });

  let cmp: ReactNode;
  let showOk = false;
  if (checkAsync.loading) {
    cmp = (
      <Styled.Loading>
        <Loader />
      </Styled.Loading>
    );
  } else if (checkAsync.result) {
    const details = [
      { label: 'LND', value: 'v0.8.0-beta' },
      { label: 'Bitcoin Core', value: 'v0.19.0.1' },
    ];
    cmp = (
      <>
        <Result title={l('updatesTitle')} subTitle={l('updatesDesc')} />
        <Styled.Details>
          <DetailsList details={details} />
        </Styled.Details>
      </>
    );
    showOk = true;
  } else if (checkAsync.error) {
    cmp = (
      <Result
        status="error"
        title={l('errorTitle')}
        subTitle={checkAsync.error.message}
      />
    );
  } else {
    cmp = (
      <Result status="success" title={l('successTitle')} subTitle={l('successDesc')} />
    );
  }

  return (
    <Modal
      title={l('title')}
      onCancel={onClose}
      destroyOnClose
      visible
      width={600}
      centered
      cancelText={l('closeBtn')}
      okText={l('okBtn')}
      okButtonProps={{
        loading: updateAsync.loading,
        style: showOk ? {} : { display: 'none' },
      }}
      onOk={updateAsync.execute}
    >
      {cmp}
    </Modal>
  );
};

export default ImageUpdatesModal;
