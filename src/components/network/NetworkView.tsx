import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Redirect, RouteComponentProps } from 'react-router';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import { Alert, Button, Empty, Input, Modal, PageHeader } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { getMissingImages } from 'utils/network';
import { StatusTag } from 'components/common';
import NetworkDesigner from 'components/designer/NetworkDesigner';
import { HOME } from 'components/routing';
import NetworkActions from './NetworkActions';

const Styled = {
  Empty: styled(Empty)`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `,
  NetworkView: styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 10px;
    flex: 0;
  `,
  RenameInput: styled(Input)`
    width: 500px;
  `,
  Alert: styled(Alert)`
    margin-bottom: 10px;
  `,
  NetworkDesigner: styled(NetworkDesigner)`
    flex: 1;
  `,
  Error: styled.pre`
    font-size: 11px;
  `,
};

interface MatchParams {
  id?: string;
}

const NetworkView: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  useEffect(() => info('Rendering NetworkView component'), []);
  const { l } = usePrefixedTranslation('cmps.network.NetworkView');

  const theme = useTheme();
  const { networks } = useStoreState(s => s.network);
  const networkId = parseInt(match.params.id || '');
  const network = networks.find(n => n.id === networkId);

  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState('');

  const { dockerImages } = useStoreState(s => s.app);
  const { navigateTo, notify } = useStoreActions(s => s.app);
  const { clearActiveId } = useStoreActions(s => s.designer);
  const { toggle, rename, remove } = useStoreActions(s => s.network);
  const toggleAsync = useAsyncCallback(toggle);
  const renameAsync = useAsyncCallback(async (payload: { id: number; name: string }) => {
    try {
      await rename(payload);
      setEditing(false);
    } catch (error) {
      notify({ message: l('renameError'), error });
    }
  });

  const showRemoveModal = (networkId: number, name: string) => {
    Modal.confirm({
      title: l('deleteTitle'),
      content: l('deleteContent'),
      okText: l('deleteConfirmBtn'),
      okType: 'danger',
      cancelText: l('deleteCancelBtn'),
      onOk: async () => {
        try {
          await remove(networkId);
          notify({ message: l('deleteSuccess', { name }) });
          // no need to navigate away since it will be done by useEffect below
        } catch (error) {
          notify({ message: l('deleteError'), error });
          throw error;
        }
      },
    });
  };

  const handleBackClick = useCallback(() => {
    navigateTo(HOME);
    clearActiveId();
  }, [navigateTo, clearActiveId]);

  if (!network) {
    return <Redirect to={HOME} />;
  }

  let header: ReactNode;
  if (editing) {
    header = (
      <Styled.PageHeader
        colors={theme.pageHeader}
        title={
          <Styled.RenameInput
            name="newNetworkName"
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
          />
        }
        extra={[
          <Button
            key="save"
            type="primary"
            loading={renameAsync.loading}
            onClick={() => renameAsync.execute({ id: network.id, name: editingName })}
          >
            {l('renameSave')}
          </Button>,
          <Button key="cancel" type="link" onClick={() => setEditing(false)}>
            {l('renameCancel')}
          </Button>,
        ]}
      ></Styled.PageHeader>
    );
  } else {
    header = (
      <Styled.PageHeader
        colors={theme.pageHeader}
        title={network.name}
        onBack={handleBackClick}
        tags={<StatusTag status={network.status} />}
        extra={
          <NetworkActions
            network={network}
            onClick={() => toggleAsync.execute(network.id)}
            onRenameClick={() => {
              setEditing(true);
              setEditingName(network.name);
            }}
            onDeleteClick={() => showRemoveModal(network.id, network.name)}
          />
        }
      />
    );
  }

  const missingImages = getMissingImages(network, dockerImages);
  const showNotice =
    [Status.Stopped, Status.Starting].includes(network.status) &&
    missingImages.length > 0;

  return (
    <Styled.NetworkView>
      {header}
      {showNotice && <Styled.Alert type="info" message={l('missingImages')} showIcon />}
      {toggleAsync.error && (
        <Styled.Alert
          type="error"
          message={<Styled.Error>{toggleAsync.error.message}</Styled.Error>}
        />
      )}
      <Styled.NetworkDesigner network={network} />
    </Styled.NetworkView>
  );
};

export default NetworkView;
