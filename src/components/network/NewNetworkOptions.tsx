import React from 'react';
import { Collapse } from 'antd';
import DockerNetworkName from 'components/common/DockerNetworkName';

interface Props {
  setIsDockerNetworkNameValid: (value: boolean) => void;
}

const NewNetworkOptions: React.FC<Props> = ({ setIsDockerNetworkNameValid }) => {
  return (
    <Collapse defaultActiveKey={['0']} ghost>
      <Collapse.Panel header="Advanced Options" key="1">
        <DockerNetworkName
          name="externalNetworkName"
          validateCallback={setIsDockerNetworkNameValid}
        />
      </Collapse.Panel>
    </Collapse>
  );
};

export default NewNetworkOptions;
