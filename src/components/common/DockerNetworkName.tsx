import React, { useEffect, useState } from 'react';
import { AutoComplete, Form } from 'antd';
import { useStoreActions } from 'store';

type Status = 'warning' | 'error' | undefined;

interface Props {
  onChange?: (value: string) => void;
  formName: string;
}

const DockerNetworkName: React.FC<Props> = ({ onChange, formName }) => {
  const { getExternalDockerNetworks } = useStoreActions(s => s.network);
  const [networks, setNetworks] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>(undefined);
  const [help, setHelp] = useState<string>('');

  useEffect(() => {
    (async () => {
      const networks = await getExternalDockerNetworks();
      setNetworks(networks);
    })();
  }, []);

  const validateNetworkName = (value: string) => {
    console.log(value);
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/;
    if (regex.test(value)) {
      onChange && onChange(value);
      if (!networks.includes(value)) {
        setStatus('warning');
        setHelp('Docker External Network will be created');
      } else {
        setHelp('Docker Network will be attached');
      }
    } else {
      setHelp('Invalid Docker Network Name');
      setStatus('error');
    }
    if (value.length === 0) {
      setHelp('Docker Network will be cleared');
    }
  };

  return (
    <Form.Item name={formName} label="External Docker Network" help={help}>
      <AutoComplete
        options={networks.map(network => ({
          value: network,
        }))}
        placeholder="Select a network leave blank to clear"
        filterOption={(inputValue, option) =>
          option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
        onChange={validateNetworkName}
        status={status}
      />
    </Form.Item>
  );
};

export default DockerNetworkName;
