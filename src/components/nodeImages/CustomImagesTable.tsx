import React, { useEffect, useState } from 'react';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Modal, Table } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { useStoreActions } from 'store';
import { CustomImage } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import { CustomImageModal } from './';

const Styled = {
  Table: styled(Table)`
    margin: 16px 0;
  `,
  Logo: styled.img`
    width: 24px;
    height: 24px;
    margin-right: 10px;
  `,
  DeleteButton: styled(Button)`
    color: #a61d24;
    &:hover {
      color: #800f19;
    }
  `,
};

interface CustomImageView {
  id: string;
  name: string;
  implementation: NodeImplementation;
  implName: string;
  dockerImage: string;
  logo: string;
  command: string;
}

interface Props {
  images: CustomImage[];
}

const CustomImagesTable: React.FC<Props> = ({ images }) => {
  const { l } = usePrefixedTranslation('cmps.nodeImages.CustomImagesTable');
  const currPlatform = getPolarPlatform();
  const [editingImage, setEditingImage] = useState<CustomImage>();
  const { removeCustomImage, notify } = useStoreActions(s => s.app);

  const handleEdit = (image: CustomImageView) => {
    const { id, name, implementation, dockerImage, command } = image;
    setEditingImage({ id, name, implementation, dockerImage, command });
  };

  let modal: any;
  const showRemoveModal = (image: CustomImageView) => {
    const { dockerImage } = image;
    modal = Modal.confirm({
      title: l('confirmTitle', { dockerImage }),
      content: l('confirmText'),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          await removeCustomImage(image);
          notify({ message: l('success', { dockerImage }) });
        } catch (error) {
          notify({ message: l('error'), error });
          throw error;
        }
      },
    });
  };

  // cleanup the modal when the component unmounts
  useEffect(() => () => modal && modal.destroy(), [modal]);

  // don't show the table if there are no custom images
  if (!images.length) {
    return null;
  }

  const customImages: CustomImageView[] = [];
  images.forEach(({ id, name, implementation, dockerImage, command }) => {
    const { name: implName, logo, platforms } = dockerConfigs[implementation];
    if (!platforms.includes(currPlatform)) return;
    customImages.push({ id, name, implementation, implName, dockerImage, logo, command });
  });

  return (
    <>
      <Styled.Table
        dataSource={customImages}
        title={() => l('title')}
        pagination={false}
        rowKey="id"
      >
        <Table.Column
          title={l('implementation')}
          dataIndex="implName"
          render={(implName: string, image: CustomImageView) => (
            <span key="implName">
              <Styled.Logo src={image.logo} />
              {implName}
            </span>
          )}
        />
        <Table.Column title={l('name')} dataIndex="name" />
        <Table.Column title={l('dockerImage')} dataIndex="dockerImage" />
        <Table.Column title={l('command')} dataIndex="command" ellipsis />
        <Table.Column
          title={l('manage')}
          width={200}
          align="right"
          render={(_, image: CustomImageView) => (
            <>
              <Button
                type="link"
                icon={<FormOutlined />}
                onClick={() => handleEdit(image)}
              >
                {l('edit')}
              </Button>
              <Styled.DeleteButton
                type="link"
                icon={<DeleteOutlined />}
                onClick={() => showRemoveModal(image)}
              ></Styled.DeleteButton>
            </>
          )}
        />
      </Styled.Table>
      {editingImage && (
        <CustomImageModal
          image={editingImage}
          onClose={() => setEditingImage(undefined)}
        />
      )}
    </>
  );
};

export default CustomImagesTable;
