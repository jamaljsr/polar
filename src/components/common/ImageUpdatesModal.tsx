import React, { ReactNode, useCallback, useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Checkbox, Modal, Result } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { DockerRepoUpdates } from 'types';
import { dockerConfigs } from 'utils/constants';
import { DetailsList, Loader } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';

const Styled = {
  Loading: styled.div`
    min-height: 200px;
  `,
  Details: styled.div`
    width: 70%;
    margin: auto;
  `,
};

const mapUpdatesToDetails = (updates: Record<NodeImplementation, string[]>) => {
  const details: DetailValues = [];
  Object.entries(updates).forEach(([name, versions]) => {
    const config = dockerConfigs[name as NodeImplementation];
    details.push(
      ...versions.map(version => ({
        label: config.name,
        value: version.startsWith('v') ? version : `v${version}`,
      })),
    );
  });
  return details;
};

interface Props {
  onClose: () => void;
}

const ImageUpdatesModal: React.FC<Props> = ({ onClose }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.ImageUpdatesModal');

  const [repoUpdates, setRepoUpdates] = useState<DockerRepoUpdates>();
  const { settings } = useStoreState(s => s.app);
  const { notify, checkForRepoUpdates, saveRepoState, updateSettings } = useStoreActions(
    s => s.app,
  );

  const checkAsync = useAsync(async () => {
    const res = await checkForRepoUpdates();
    if (res.updates) {
      setRepoUpdates(res);
    }
  }, []);

  const handleUpdatesToggled = useCallback((e: CheckboxChangeEvent) => {
    updateSettings({ checkForUpdatesOnStartup: e.target.checked });
  }, []);

  const updateAsync = useAsyncCallback(async () => {
    try {
      if (repoUpdates) {
        await saveRepoState(repoUpdates.state);
      }
      onClose();
      notify({ message: l('addSuccess') });
    } catch (error: any) {
      notify({ message: l('addError'), error });
    }
  });

  let cmp: ReactNode;
  if (checkAsync.loading) {
    cmp = (
      <Styled.Loading>
        <Loader />
      </Styled.Loading>
    );
  } else if (checkAsync.error) {
    cmp = (
      <Result
        status="error"
        title={l('errorTitle')}
        subTitle={checkAsync.error.message}
      />
    );
  } else if (repoUpdates && repoUpdates.updates) {
    const { updates } = repoUpdates;
    cmp = (
      <>
        <Result title={l('updatesTitle')} subTitle={l('updatesDesc')} />
        <Styled.Details>
          <DetailsList details={mapUpdatesToDetails(updates)} />
        </Styled.Details>
      </>
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
      open
      width={600}
      centered
      cancelText={l('closeBtn')}
      okText={l('okBtn')}
      okButtonProps={{
        loading: updateAsync.loading,
        style: repoUpdates ? {} : { display: 'none' },
      }}
      onOk={updateAsync.execute}
    >
      {cmp}
      <Styled.Details>
        <Checkbox
          onChange={handleUpdatesToggled}
          checked={settings.checkForUpdatesOnStartup}
        >
          {l('checkForUpdates')}
        </Checkbox>
      </Styled.Details>
    </Modal>
  );
};

export default ImageUpdatesModal;
