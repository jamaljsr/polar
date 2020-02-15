import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';
import { dockerConfigs } from 'utils/constants';
import DockerCommandInput from 'components/common/form/DockerCommandInput';

const Styled = {
  UpdateButton: styled(Button)`
    margin-top: 16px;
  `,
};

interface Props {
  node: LightningNode;
}

const AdvancedTab: React.FC<Props> = ({ node }) => {
  const { updateAdvancedOptions } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);
  const [command, setCommand] = useState(node.docker.command);
  const updateAsync = useAsyncCallback(async () => {
    try {
      await updateAdvancedOptions({ node, command });
      notify({ message: `Updated advanced options for ${node.name}` });
    } catch (error) {
      notify({ message: 'Unable to update options', error });
    }
  });

  return (
    <>
      <DockerCommandInput
        value={command}
        defaultCommand={dockerConfigs[node.implementation].command}
        onChange={setCommand}
        disabled={updateAsync.loading}
      />
      <Styled.UpdateButton
        type="primary"
        block
        onClick={updateAsync.execute}
        loading={updateAsync.loading}
      >
        Update
      </Styled.UpdateButton>
    </>
  );
};

export default AdvancedTab;
