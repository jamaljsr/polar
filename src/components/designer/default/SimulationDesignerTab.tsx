import React, { ReactNode, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { usePrefixedTranslation } from 'hooks';
import { Button, Empty, Modal, Tooltip, MenuProps, Dropdown } from 'antd';
import {
  ArrowRightOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  StopOutlined,
  WarningOutlined,
  CloseOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { useAsyncCallback } from 'react-async-hook';
import { Status } from 'shared/types';
import { ButtonType } from 'antd/lib/button';

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
  Button: styled(Button)`
    margin-left: 0;
    margin-top: 20px;
    width: 100%;
  `,
  SimContainer: styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 46px;
    padding: 10px 15px;
    margin-top: 20px;
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
};

const config: {
  [key: number]: {
    label: string;
    type: ButtonType;
    danger?: boolean;
    icon: ReactNode;
  };
} = {
  [Status.Starting]: {
    label: 'Starting',
    type: 'primary',
    icon: '',
  },
  [Status.Started]: {
    label: 'Stop',
    type: 'primary',
    danger: true,
    icon: <StopOutlined />,
  },
  [Status.Stopping]: {
    label: 'Stopping',
    type: 'default',
    icon: '',
  },
  [Status.Stopped]: {
    label: 'Start',
    type: 'primary',
    icon: <PlayCircleOutlined />,
  },
  [Status.Error]: {
    label: 'Restart',
    type: 'primary',
    danger: true,
    icon: <WarningOutlined />,
  },
};

const SimulationDesignerTab: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.default.DefaultSidebar.SimulationDesignerTab',
  );

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
  const { label, type, danger, icon } =
    config[currentNetwork?.simulation?.status || Status.Stopped];

  const startSimulationAsync = useAsyncCallback(async () => {
    if (!network.simulation) return;
    try {
      await startSimulation({ id: network.simulation.networkId });
    } catch (error: any) {
      notify({ message: l('startError'), error });
    }
  });

  const stopSimulationAsync = useAsyncCallback(async () => {
    if (!network.simulation) return;
    try {
      await stopSimulation({ id: network.simulation.networkId });
    } catch (error: any) {
      notify({ message: l('stopError'), error });
    }
  });

  const addSimulation = () => {
    showAddSimulation({});
  };

  let modal: any;
  const showRemoveModal = () => {
    modal = Modal.confirm({
      title: l('removeTitle'),
      content: l('removeDesc'),
      okText: l('removeBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          if (!network.simulation) return;
          await removeSimulation(network.simulation);
          notify({ message: l('removeSuccess') });
        } catch (error: any) {
          notify({ message: l('removeError'), error: error });
        }
      },
    });
  };

  const openAsync = useAsyncCallback(async () => {
    await openWindow(`/logs/simln/polar-n${network.id}-simln`);
  });

  const handleClick: MenuProps['onClick'] = useCallback((info: { key: string }) => {
    switch (info.key) {
      case 'logs':
        openAsync.execute();
        break;
      case 'delete':
        showRemoveModal();
        break;
    }
  }, []);

  const items: MenuProps['items'] = [
    { key: 'logs', label: 'View Logs', icon: <FileTextOutlined /> },
    { key: 'delete', label: 'Delete', icon: <CloseOutlined /> },
  ];

  // cleanup the modal when the component unmounts
  useEffect(() => () => modal && modal.destroy(), [modal]);

  let cmp: ReactNode;

  if (network.simulation) {
    cmp = (
      <>
        <Styled.SimContainer>
          <Styled.NodeWrapper>
            <span>{network.simulation.source.name}</span>
            <ArrowRightOutlined />
            <span>{network.simulation.destination.name}</span>
          </Styled.NodeWrapper>
          <Styled.Dropdown
            key="options"
            menu={{ theme: 'dark', items, onClick: handleClick }}
          >
            <MoreOutlined />
          </Styled.Dropdown>
        </Styled.SimContainer>
        <Styled.Button
          key="start"
          type={type}
          danger={danger}
          icon={icon}
          loading={loading}
          ghost={started}
          onClick={started ? stopSimulationAsync.execute : startSimulationAsync.execute}
        >
          {l(`primaryBtn${label}`)}
        </Styled.Button>
      </>
    );
  } else {
    cmp = (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l('emptyMsg')}>
        <Button type="primary" icon={<PlusOutlined />} onClick={addSimulation}>
          {l('createBtn')}
        </Button>
      </Empty>
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
            disabled={loading || network.simulation !== undefined}
          />
        </Tooltip>
      </Styled.Title>
      {cmp}
    </div>
  );
};

export default SimulationDesignerTab;
