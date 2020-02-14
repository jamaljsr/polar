import React from 'react';
import { Collapse, Table } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { dockerConfigs } from 'utils/constants';

interface Props {
  implementation: NodeImplementation;
}

const CommandVariables: React.FC<Props> = ({ implementation }) => {
  const { l } = usePrefixedTranslation('cmps.nodeImages.CommandVariables');

  const columns = [
    { title: l('variable'), dataIndex: 'variable', key: 'variable' },
    { title: l('desc'), dataIndex: 'desc', key: 'desc' },
  ];

  // the descriptions for the variables need to be translated, so they
  // are pulled dynamically from the locale file. If a variable is added
  // or modified, the en-US.json file should be updated as well
  const { variables } = dockerConfigs[implementation];
  const dataSource = variables.map(variable => ({
    variable,
    desc: l(`var-${variable}`),
  }));

  return (
    <Collapse bordered={true}>
      <Collapse.Panel header={l('header')} key="vars">
        <Table
          columns={columns}
          dataSource={dataSource}
          title={() => l('tableTitle')}
          size="small"
          rowKey="variable"
          pagination={false}
        />
      </Collapse.Panel>
    </Collapse>
  );
};

export default CommandVariables;
