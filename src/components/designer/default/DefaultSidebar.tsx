import React, { ReactNode, useState } from 'react';
import { usePrefixedTranslation } from 'hooks';
import SidebarCard from '../SidebarCard';
import NetworkDesignerTab from './NetworkDesignerTab';
import SimulationDesignerTab from './SimulationDesignerTab';
import { Network } from 'types';

interface Props {
  network: Network;
}

const DefaultSidebar: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.DefaultSidebar');
  const [activeTab, setActiveTab] = useState('network');

  const tabHeaders = [
    { key: 'network', tab: l('networkTabTitle') },
    { key: 'simulation', tab: l('simulationTabTitle') },
  ];
  const tabContents: Record<string, ReactNode> = {
    network: <NetworkDesignerTab />,
    simulation: <SimulationDesignerTab network={network} />,
  };

  return (
    <SidebarCard tabList={tabHeaders} activeTabKey={activeTab} onTabChange={setActiveTab}>
      {tabContents[activeTab]}
    </SidebarCard>
  );
};

export default DefaultSidebar;
