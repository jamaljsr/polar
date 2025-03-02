import React, { ReactNode, useState } from 'react';
import { usePrefixedTranslation } from 'hooks';
import SidebarCard from '../SidebarCard';
import NetworkDesignerTab from './NetworkDesignerTab';
import SimulationDesignerTab from './SimulationDesignerTab';

const DefaultSidebar: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.designer.default.DefaultSidebar');
  const [activeTab, setActiveTab] = useState('network');

  const tabHeaders = [
    { key: 'network', tab: l('networkTabTitle') },
    { key: 'simulation', tab: l('simulationTabTitle') },
  ];
  const tabContents: Record<string, ReactNode> = {
    network: <NetworkDesignerTab />,
    simulation: <SimulationDesignerTab />,
  };

  return (
    <SidebarCard tabList={tabHeaders} activeTabKey={activeTab} onTabChange={setActiveTab}>
      {tabContents[activeTab]}
    </SidebarCard>
  );
};

export default DefaultSidebar;
