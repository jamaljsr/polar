import React, { useState } from 'react';
import { AutoComplete, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreState } from 'store';
import { DOCKER_REPO } from 'utils/constants';

interface Props {
  name: string;
  label: string;
  disabled?: boolean;
}

const DockerImageInput: React.FC<Props> = ({ name, label, disabled }) => {
  const { l } = usePrefixedTranslation('cmps.common.form.DockerImageInput');

  const { dockerImages } = useStoreState(s => s.app);
  const images = dockerImages
    .filter(i => !i.startsWith(DOCKER_REPO))
    .map(i => ({ value: i }));
  const [options, setOptions] = useState<{ value: string }[]>([]);

  const handleSearch = (text: string) => {
    if (!text) {
      setOptions(images);
    } else {
      setOptions(images.filter(({ value }) => value.startsWith(text)));
    }
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <AutoComplete
        options={options}
        onSearch={handleSearch}
        onFocus={() => handleSearch('')}
        disabled={disabled}
      />
    </Form.Item>
  );
};

export default DockerImageInput;
