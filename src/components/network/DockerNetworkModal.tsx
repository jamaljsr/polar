import React, { useState } from 'react';
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

  const { setDockerExternalNetworkName, getExternalDockerNetworks } = useStoreActions(
    s => s.network,
  );

  const { notify } = useStoreActions(s => s.app);
  const [isDockerNetworkNameValid, setIsDockerNetworkNameValid] = useState<boolean>(true);

  const setExternalDockerNetworkAsync = useAsyncCallback(
    async (id: number, externalNetworkName: string | undefined) => {
      try {
        //setting externalNetworkName
        await setDockerExternalNetworkName({ id, externalNetworkName });

        if (!externalNetworkName || externalNetworkName === 'default') {
          notify({
            message: 'Clearing external network',
          });
        } else {
          const networks = await getExternalDockerNetworks();
          if (!networks.includes(externalNetworkName as string)) {
            notify({
              message: 'Creating and attaching to external network',
              description: `Creating ${externalNetworkName}`,
            });
          } else {
            notify({
              message: 'Attaching to existing external network',
              description: `Attaching ${externalNetworkName}`,
            });
          }
        }
        hideDockerNetwork();
      } catch (error: any) {
        notify({ message: l('submitError'), error });
      }
    },
  );

  const handleSubmit = (values: { networkName: string }) => {
    setExternalDockerNetworkAsync.execute(network.id, values.networkName);
  };

  return (
    <Modal
      title={l('title')}
      open={visible}
      destroyOnClose
      onCancel={() => hideDockerNetwork()}
      onOk={form.submit}
      okButtonProps={{
        disabled: setExternalDockerNetworkAsync.loading || !isDockerNetworkNameValid,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        colon={false}
        onFinish={handleSubmit}
        initialValues={{
          networkName: network.externalNetworkName,
        }}
      >
        <DockerNetworkName
          name="networkName"
          validateCallback={setIsDockerNetworkNameValid}
        />
      </Form>
    </Modal>
  );
};
export default DockerNetworkModal;
