import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import DockerNetworkName from 'components/common/DockerNetworkName';

interface Props {
  network: Network;
}

const DockerNetworkModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.network.actions.DockerNetworkModal');
  const [form] = Form.useForm();
  const { visible } = useStoreState(s => s.modals.dockerNetwork);
  const { hideDockerNetwork } = useStoreActions(s => s.modals);
  const { setDockerExternalNetworkName } = useStoreActions(s => s.network);

  const { notify } = useStoreActions(s => s.app);

  const setExternalDockerNetworkAsync = useAsyncCallback(
    async (id: number, externalNetworkName: string | undefined) => {
      try {
        //setting externalNetworkName
        await setDockerExternalNetworkName({ id, externalNetworkName });
        notify({
          message: 'Attaching to external network',
          description: `${externalNetworkName}`,
        });
        hideDockerNetwork();
      } catch (error: any) {
        notify({ message: l('submitError'), error });
      }
    },
  );

  const handleSubmit = (values: { networkName: string }) => {
    console.log(values.networkName);
    setExternalDockerNetworkAsync.execute(network.id, values.networkName);
  };

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hideDockerNetwork()}
      onOk={form.submit}
      okButtonProps={{
        disabled: setExternalDockerNetworkAsync.loading || status === 'error',
      }}
    >
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        onFinish={handleSubmit}
      >
        <DockerNetworkName formName="networkName" />
      </Form>
    </Modal>
  );
};
export default DockerNetworkModal;
