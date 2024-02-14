import React, { useState } from 'react';
import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { ThemeColors } from 'theme/colors';
import { ActivityInfo, Network, SimulationActivity } from 'types';
import ActivityGenerator from '../../ActivityGenerator';
import { useStoreActions } from 'store';

const Styled = {
  AddNodes: styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    margin: 30px 0 10px 0;
    > h3 {
      margin: 0;
      padding: 0;
    }
  `,
  AddDesc: styled.p`
    opacity: 0.5;
    font-size: 12px;
    margin-bottom: 20px;
  `,
  ActivityButtons: styled(Button.Group)`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    border-radius: 4px;
    cursor: pointer;
  `,
  Activity: styled(Button)<{ colors: ThemeColors['dragNode'] }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    opacity: 1;
    width: 100%;
    height: 46px;
    padding: 10px 15px;
    margin-top: 20px;
    border: 1px solid ${props => props.colors.border};
    box-shadow: 4px 2px 9px ${props => props.colors.shadow};
    border-radius: 4px;
    font-weight: bold;

    &:hover {
      border: 1px solid #d46b08;
      color: #f7f2f2f2;
    }
  `,
  CopyButton: styled(Button)`
    border: none;
    height: 100%;
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }
  `,
  Divider: styled.div`
    height: 1px;
    width: 100%;
    margin: 30px 0 20px 0;
    background: #545353e6;
    opacity: 0.5;
  `,
  DeleteButton: styled(Button)`
    border: none;
    height: 100%;
    color: red;
    opacity: 0.5;

    &:hover {
      color: red;
      opacity: 1;
    }
  `,
  NodeWrapper: styled.div`
    display: flex;
    align-items: center;
    justify-content: start;
    column-gap: 15px;
    width: 100%;
  `,
  StartStopButton: styled(Button)<{ active: boolean; colors: ThemeColors['dragNode'] }>`
    padding: 10px 15px;
    margin: 40px 0 0 0;
    width: 100%;
    height: 46px;
    color: ${props => (props.active ? '#d46b08' : '#fff')};
    background: ${props => (props.active ? '#000' : '')};
    border: 1px solid ${props => props.colors.border};
    box-shadow: 4px 2px 9px ${props => props.colors.shadow};

    &:hover {
      background: #d46b08;
      color: #fff;
    }

    &:focus {
      background: ${props => (props.active ? '#000' : '#d46b08')};
      color: ${props => (props.active ? '#f7f2f2f2' : '#000')};
    }
  `,
  Toggle: styled(Button)`
    border: none;
    opacity: 0.6;
    margin-left: 10px;

    &:hover {
      color: #fff;
      border: 1px solid #fff;
    }

    &:focus {
      color: #fff;
      border: 1px solid #fff;
    }
  `,
};

interface Props {
  network: Network;
  visible: boolean;
}

const defaultActivityInfo: ActivityInfo = {
  id: undefined,
  sourceNode: undefined,
  targetNode: undefined,
  amount: 1,
  frequency: 1,
};

const ActivityDesignerCard: React.FC<Props> = ({ visible, network }) => {
  const [isSimulationActive, setIsStartSimulationActive] = React.useState(false);
  const [isAddActivityActive, setIsAddActivityActive] = React.useState(false);

  const { addSimulationActivity } = useStoreActions(s => s.network);
  const { lightning } = network.nodes;

  const [activityInfo, setActivityInfo] = useState<ActivityInfo>(defaultActivityInfo);

  const theme = useTheme();
  const { l } = usePrefixedTranslation(
    'cmps.designer.default.cards.ActivityDesignerCard',
  );
  const numberOfActivities = network.simulationActivities.length;
  const { removeSimulationActivity } = useStoreActions(s => s.network);

  const toggleAddActivity = () => {
    setIsAddActivityActive(prev => !prev);
  };

  const handleRemoveActivity = async (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    activity: SimulationActivity,
  ) => {
    e.stopPropagation();
    await removeSimulationActivity(activity);
  };

  const handleDuplicateActivity = async (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    activity: SimulationActivity,
  ) => {
    e.stopPropagation();
    await addSimulationActivity(activity);
  };

  const resolveLabelToNode = (name: string) => {
    const selectedNode = lightning.find(n => n.name === name);
    return selectedNode;
  };
  const handleSelectActivity = (activity: SimulationActivity) => {
    const sourceNode = resolveLabelToNode(activity.source.label);
    const targetNode = resolveLabelToNode(activity.destination.label);
    setActivityInfo({
      id: activity.id,
      sourceNode,
      targetNode,
      amount: activity.amountMsat,
      frequency: activity.intervalSecs,
    });
    setIsAddActivityActive(true);
  };

  const resolveUpdater = <T extends keyof ActivityInfo>({
    name,
    value,
  }: {
    name: T;
    value: ActivityInfo[T];
  }) => {
    setActivityInfo(prev => ({ ...prev, [name]: value }));
  };

  const reset = () => {
    setActivityInfo(defaultActivityInfo);
  };

  if (!visible) return null;
  return (
    <>
      <div>
        <p>{l('mainDesc')}</p>
      </div>
      <Styled.AddNodes>
        <h3>{l('addActivitiesTitle')}</h3>
        <Styled.Toggle
          type="ghost"
          size="small"
          shape="circle"
          icon={isAddActivityActive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          onClick={toggleAddActivity}
        />
      </Styled.AddNodes>
      <Styled.AddDesc>{l('addActivitiesDesc')}</Styled.AddDesc>
      <ActivityGenerator
        visible={isAddActivityActive}
        activities={network.simulationActivities}
        activityInfo={activityInfo}
        network={network}
        toggle={toggleAddActivity}
        updater={resolveUpdater}
        reset={reset}
      />
      <Styled.Divider />
      <p>
        {l('activities')}
        {` (${numberOfActivities})`}
      </p>
      <Styled.ActivityButtons>
        {network.simulationActivities.map(activity => (
          <Styled.Activity
            key={`id-${activity.id}-${activity.source.address}-${activity.destination.address}`}
            colors={theme.dragNode}
            onClick={() => handleSelectActivity(activity)}
          >
            <Styled.NodeWrapper>
              <span>{activity.source.label}</span>
              <ArrowRightOutlined />
              <span>{activity.destination.label}</span>
            </Styled.NodeWrapper>
            <Tooltip title={l('duplicateBtnTip')}>
              <Styled.CopyButton
                onClick={e => handleDuplicateActivity(e, activity)}
                icon={<CopyOutlined />}
              />
            </Tooltip>
            <Styled.DeleteButton
              onClick={e => handleRemoveActivity(e, activity)}
              icon={<DeleteOutlined />}
            />
          </Styled.Activity>
        ))}
      </Styled.ActivityButtons>
      <Styled.StartStopButton
        colors={theme.dragNode}
        active={isSimulationActive}
        onClick={() => setIsStartSimulationActive(!isSimulationActive)}
      >
        {isSimulationActive ? l('stop') : l('start')}
      </Styled.StartStopButton>
    </>
  );
};

export default ActivityDesignerCard;
