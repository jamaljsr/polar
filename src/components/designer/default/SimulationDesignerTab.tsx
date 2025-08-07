import React, { ReactNode, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { usePrefixedTranslation } from 'hooks';
import { Button, Empty, Modal, Tooltip, MenuProps, Dropdown, Alert } from 'antd';
import {
  ArrowRightOutlined,
  FileTextOutlined,
  PlusOutlined,
  CloseOutlined,
  MoreOutlined,
  UpOutlined,
  DownOutlined,
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
  SimContainer: styled.div<{ visible?: boolean }>`
    display: ${props => (props.visible ? 'flex' : 'none')};
    align-items: start;
    max-height: 100px;
    overflow-y: auto;
    justify-content: space-between;
    width: 100%;
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
  Arrow: styled.span<{ visible?: boolean }>`
    width: 25px;
    text-align: right;
    margin-left: 12px;

    > .anticon {
      opacity: 0.4;
      display: ${props => (props.visible ? 'inline' : 'none')};
      cursor: pointer;

      &:hover {
        opacity: 1;
      }
    }
  `,
  MoreOutlinedButton: styled(MoreOutlined)<{ visible?: boolean }>`
    display: ${props => (props.visible ? 'inline' : 'none')};
  `,
};

const SimulationDesignerTab: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.default.DefaultSidebar.SimulationDesignerTab',
  );

  const [expanded, setExpanded] = React.useState<boolean>(false);

  const toggleExpanded = () => setExpanded(!expanded);

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
    {
      key: 'logs',
      label: 'View Logs',
      icon: <FileTextOutlined />,
      disabled: !started,
    },
    { key: 'delete', label: 'Delete', icon: <CloseOutlined /> },
  ];

  // cleanup the modal when the component unmounts
  useEffect(() => () => modal && modal.destroy(), [modal]);

  let cmp: ReactNode;

  if (network.simulation) {
    const { activity } = network.simulation;
    cmp = (
      <>
        {activity.map((a, index) => (
          <Styled.SimContainer key={index} visible={index === 0 || expanded}>
            <Styled.NodeWrapper>
              <span>{a.source.name}</span>
              <ArrowRightOutlined />
              <span>{a.destination.name}</span>
            </Styled.NodeWrapper>
            <Styled.Dropdown
              key="options"
              menu={{ theme: 'dark', items, onClick: handleClick }}
            >
              <Styled.MoreOutlinedButton visible={index === 0} />
            </Styled.Dropdown>
            <Styled.Arrow
              role="toggle"
              tabIndex={0}
              visible={index === 0}
              onClick={toggleExpanded}
            >
              {expanded ? <UpOutlined /> : <DownOutlined />}
            </Styled.Arrow>
          </Styled.SimContainer>
        ))}

        <StatusButton
          status={status}
          onClick={started ? stopSimulationAsync.execute : startSimulationAsync.execute}
          fullWidth
        />
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
            disabled={
              loading ||
              network.status !== Status.Started ||
              network.simulation !== undefined
            }
          />
        </Tooltip>
      </Styled.Title>
      {cmp}
    </div>
  );
};

export default SimulationDesignerTab;
