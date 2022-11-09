import { FieldTimeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { usePrefixedTranslation } from 'hooks';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RootModel } from 'store/models';
import { AutoMinerModel } from 'store/models/network';
import { AutoMineMode, Network } from 'types';

const barCssTransition = 'width 400ms ease-in-out';

const Styled = {
  Button: styled(Button)`
    margin-left: 8px;
  `,
  RemainingBar: styled.div`
    -webkit-transition: ${barCssTransition};
    -moz-transition: ${barCssTransition};
    -o-transition: ${barCssTransition};
    transition: ${barCssTransition};
    background: #d46b08;
    position: absolute;
    width: 100%;
    height: 3px;
    bottom: 0;
    left: 0;
  `,
};

interface Props {
  network: Network;
}

const getRemainingPercentage = (mode: AutoMineMode, startTime: number) => {
  if (mode === AutoMineMode.AutoOff) return 0;
  else {
    const elapsedTime = Date.now() - startTime;
    const autoMineInterval = 1000 * +mode;
    const remainingTime = autoMineInterval - (elapsedTime % autoMineInterval);
    const remainingPercentage = Math.round((100 * remainingTime) / autoMineInterval);

    return remainingPercentage;
  }
};

const AutoMineButton: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.AutoMineButton');
  const { autoMine } = useStoreActions((s: any) => s.network);
  const autoMiner = useStoreState<RootModel, AutoMinerModel>(
    s => s.network.autoMiners[network.id],
  );
  const [remainingPercentage, setRemainingPercentage] = useState(0);
  const tickTimer = useRef(0);

  useEffect(() => {
    return () => {
      tickTimer.current && clearInterval(tickTimer.current);
    };
  }, []);

  useEffect(() => {
    if (network.autoMineMode === AutoMineMode.AutoOff) {
      clearInterval(tickTimer.current);
      tickTimer.current = 0;
      setRemainingPercentage(0);
    } else {
      tickTimer.current = +setInterval(() => {
        setRemainingPercentage(
          getRemainingPercentage(network.autoMineMode, autoMiner.startTime),
        );
      }, 1000);
    }
  }, [network.autoMineMode, setRemainingPercentage]);

  const autoMineStatusShortMap = useMemo(() => {
    return {
      [AutoMineMode.AutoOff]: l('autoOff'),
      [AutoMineMode.Auto30s]: l('autoThirtySecondsShort'),
      [AutoMineMode.Auto1m]: l('autoOneMinuteShort'),
      [AutoMineMode.Auto5m]: l('autoFiveMinutesShort'),
      [AutoMineMode.Auto10m]: l('autoTenMinutesShort'),
    };
  }, [l]);

  const handleAutoMineModeChanged = useCallback(
    (e: any) => {
      autoMine({
        mode: e.key,
        id: network.id,
      });
    },
    [network, autoMine],
  );

  const menuItems = useMemo<any[]>(() => {
    return [
      {
        label: l('autoOff'),
        key: AutoMineMode.AutoOff,
      },
      {
        type: 'divider',
      },
      {
        label: l('autoThirtySeconds'),
        key: AutoMineMode.Auto30s,
      },
      {
        label: l('autoOneMinute'),
        key: AutoMineMode.Auto1m,
      },
      {
        label: l('autoFiveMinutes'),
        key: AutoMineMode.Auto5m,
      },
      {
        label: l('autoTenMinutes'),
        key: AutoMineMode.Auto10m,
      },
    ];
  }, [l]);

  const MenuElement = useMemo(
    () => (
      <Menu
        items={menuItems}
        selectedKeys={[network.autoMineMode || AutoMineMode.AutoOff]}
        onClick={handleAutoMineModeChanged}
      />
    ),
    [handleAutoMineModeChanged, menuItems, network.autoMineMode],
  );

  return (
    <Tooltip title={l('autoMineBtnTip')}>
      <Dropdown overlay={MenuElement} trigger={['hover']}>
        <Styled.Button icon={<FieldTimeOutlined />} loading={autoMiner.mining}>
          {l('autoMine')}: {autoMineStatusShortMap[network.autoMineMode]}
          <Styled.RemainingBar
            style={{
              width: `${remainingPercentage}%`,
            }}
          />
        </Styled.Button>
      </Dropdown>
    </Tooltip>
  );
};

export default AutoMineButton;
