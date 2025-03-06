import React, { ReactNode, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { usePrefixedTranslation } from 'hooks';
import { Button, Empty, Modal, Tooltip, MenuProps, Dropdown, Alert } from 'antd';
import {
  ArrowRightOutlined,
  PlusOutlined,
  CloseOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { useAsyncCallback } from 'react-async-hook';
import { Status } from 'shared/types';
import StatusButton from 'components/common/StatusButton';

interface Props {
  network: Network;
}

const Styled = {
  Title: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-weight: bold;
  `,
  SimContainer: styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 46px;
    padding: 10px 15px;
    margin-top: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-weight: bold;
  `,
  NodeWrapper: styled.div`
    display: flex;
    align-items: center;
    justify-content: start;
    column-gap: 15px;
    width: 100%;
  `,
  Dropdown: styled(Dropdown)`
    margin-left: 12px;
  `,
  ViewLogsButton: styled(Button)`
    margin-top: 10px;
    width: 100%;
  `,
};

const SimulationDesignerTab: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.SimulationDesignerTab');

  // Getting the network from the store makes this component to
  // re-render when the network is updated (i.e when we add a simulation).
  const { networks } = useStoreState(s => s.network);
  const currentNetwork = networks.find(n => n.id === network.id);

  const { showAddSimulation } = useStoreActions(s => s.modals);

  const { notify, openWindow } = useStoreActions(s => s.app);

  const { startSimulation, stopSimulation, removeSimulation } = useStoreActions(
    s => s.network,
  );

  const loading =
    currentNetwork?.simulation?.status === Status.Starting ||
    currentNetwork?.simulation?.status === Status.Stopping;
  const started = currentNetwork?.simulation?.status === Status.Started;
  const status = currentNetwork?.simulation?.status ?? Status.Stopped;

  const startSimulationAsync = useAsyncCallback(async () => {
    if (!network.simulation) return;
    if (network.simulation.activity.length === 0) {
      notify({
        message: l('noActivities'),
        error: new Error('Add activities to the simulation to start it.'),
      });
      return;
    }
    try {
      await startSimulation({ id: network.id });
    } catch (error: any) {
      notify({ message: l('startError'), error });
    }
  });

  const stopSimulationAsync = useAsyncCallback(async () => {
    if (!network.simulation) return;
    try {
      await stopSimulation({ id: network.id });
    } catch (error: any) {
      notify({ message: l('stopError'), error });
    }
  });

  const addSimulation = () => {
    showAddSimulation({});
  };

  let modal: any;
  const showRemoveModal = (networkId: number, activityId: number) => {
    modal = Modal.confirm({
      title: l('removeTitle'),
      content: l('removeDesc'),
      okText: l('removeBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        await removeSimulation({ id: activityId, networkId });
        notify({ message: l('removeSuccess') });
      },
    });
  };

  const openAsync = useAsyncCallback(async () => {
    await openWindow(`/logs/simln/polar-n${network.id}-simln`);
  });

  const handleClick = useCallback(
    (activityId: number): MenuProps['onClick'] =>
      (info: { key: string }) => {
        switch (info.key) {
          case 'delete':
            showRemoveModal(network.id, activityId);
            break;
        }
      },
    [],
  );

  const items: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete',
      icon: <CloseOutlined />,
      disabled: started || loading,
    },
  ];

  // cleanup the modal when the component unmounts
  useEffect(() => () => modal && modal.destroy(), [modal]);

  let cmp: ReactNode;

  if (network.simulation) {
    const { activity } = network.simulation;
    cmp = (
      <>
        {activity.length === 0 && (
          <Alert message={l('noActivities')} showIcon type="info" />
        )}
        {activity.map(a => (
          <Styled.SimContainer key={a.id}>
            <Styled.NodeWrapper>
              <span>{a.source}</span>
              <ArrowRightOutlined />
              <span>{a.destination}</span>
            </Styled.NodeWrapper>
            <Styled.Dropdown
              key="options"
              menu={{ theme: 'dark', items, onClick: handleClick(a.id) }}
            >
              <MoreOutlined />
            </Styled.Dropdown>
          </Styled.SimContainer>
        ))}
        <StatusButton
          status={status}
          onClick={started ? stopSimulationAsync.execute : startSimulationAsync.execute}
          fullWidth
        />
        {started && (
          <Styled.ViewLogsButton onClick={openAsync.execute}>
            View Logs
          </Styled.ViewLogsButton>
        )}
      </>
    );
  } else {
    cmp = (
      <>
        {network.status !== Status.Started && (
          <Alert message={l('networkNotStarted')} showIcon type="warning" />
        )}
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l('emptyMsg')}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSimulation}
            disabled={
              loading ||
              network.status !== Status.Started ||
              network.simulation !== undefined
            }
          >
            {l('createBtn')}
          </Button>
        </Empty>
      </>
    );
  }

  return (
    <div>
      <Styled.Title>
        <span>{l('title')}</span>
        <Tooltip overlay={l('createBtn')} placement="topLeft">
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={addSimulation}
            disabled={loading || network.status !== Status.Started || started}
          />
        </Tooltip>
      </Styled.Title>
      {cmp}
    </div>
  );
};

export default SimulationDesignerTab;
