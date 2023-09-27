import React, { useEffect, useState } from 'react';
import { AutoComplete, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

type Status = '' | 'warning' | 'error' | undefined;

interface Props {
  name: string;
  defaultValue?: string;
  validateCallback?: (value: boolean) => void;
}

const DockerNetworkName: React.FC<Props> = ({ name, defaultValue, validateCallback }) => {
  const { l } = usePrefixedTranslation('cmps.common.form.DockerNetworkName');

  const { getExternalDockerNetworks } = useStoreActions(s => s.network);

  const [dockerNetworks, setDockerNetworks] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>(undefined);
  const [help, setHelp] = useState<string>('');

  const validate = (isValid: boolean) => {
    validateCallback && validateCallback(isValid);
  };

  useEffect(() => {
    (async () => {
      const networks = await getExternalDockerNetworks();
      setDockerNetworks(networks);
    })();
  }, []);

  const validateNetworkName = async (value: string) => {
    if (value.length === 0 || value === 'default') {
      setHelp(l('helpClear'));
      setStatus(undefined);
      validate(true);
      return;
    }
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,63}$/;
    if (regex.test(value)) {
      if (!dockerNetworks.includes(value)) {
        setHelp(l('helpCreate'));
        setStatus('warning');
        validate(true);
      } else {
        setHelp(l('helpAttach', { dockerNetwork: value }));
        setStatus(undefined);
        validate(true);
      }
    } else {
      setHelp(l('helpInvalid'));
      setStatus('error');
      validate(false);
    }
  };

  return (
    <Form.Item name={name} label={l('label')} help={help}>
      <AutoComplete
        options={dockerNetworks?.map(network => ({
          value: network,
        }))}
        placeholder={l('placeholder')}
        filterOption={(inputValue, option) =>
          option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
        onChange={validateNetworkName}
        status={status}
        defaultValue={defaultValue}
      />
    </Form.Item>
  );
};

export default DockerNetworkName;
