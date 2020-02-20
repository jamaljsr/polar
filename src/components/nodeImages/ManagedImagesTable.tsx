import React, { useState } from 'react';
import { FormOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Table, Tag } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { ManagedImage } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import { ManagedImageModal } from './';

const Styled = {
  Table: styled(Table)`
    margin: 16px 0;
  `,
  Logo: styled.img`
    width: 24px;
    height: 24px;
    margin-right: 10px;
  `,
};

interface ManagedImageView {
  index: number;
  implementation: NodeImplementation;
  name: string;
  imageName: string;
  logo: string;
  version: string;
  command: string;
}

interface Props {
  images: ManagedImage[];
}

const ManagedImagesTable: React.FC<Props> = ({ images }) => {
  const { l } = usePrefixedTranslation('cmps.nodeImages.ManagedImagesTable');
  const currPlatform = getPolarPlatform();
  const [editingImage, setEditingImage] = useState<ManagedImage>();

  const handleCustomize = (image: ManagedImageView) => {
    const { implementation, version, command } = image;
    setEditingImage({ implementation, version, command });
  };

  const managedImages: ManagedImageView[] = [];
  images.forEach(({ implementation, version, command }, index) => {
    const { name, imageName, logo, platforms } = dockerConfigs[implementation];
    if (!platforms.includes(currPlatform)) return;
    managedImages.push({
      index,
      name,
      imageName,
      logo,
      implementation,
      version,
      command,
    });
  });

  return (
    <>
      <Styled.Table
        dataSource={managedImages}
        title={() => l('title')}
        pagination={false}
        rowKey="index"
      >
        <Table.Column
          title={l('implementation')}
          dataIndex="name"
          render={(name: string, image: ManagedImageView) => (
            <span key="name">
              <Styled.Logo src={image.logo} />
              {name}
            </span>
          )}
        />
        <Table.Column title={l('dockerImage')} dataIndex="imageName" />
        <Table.Column title={l('version')} dataIndex="version" />
        <Table.Column
          title={l('command')}
          dataIndex="command"
          ellipsis
          render={cmd => (cmd ? cmd : <Tag>default</Tag>)}
        />
        <Table.Column
          title={l('manage')}
          width={150}
          align="right"
          render={(_, image: ManagedImageView) => (
            <Button
              type="link"
              icon={<FormOutlined />}
              onClick={() => handleCustomize(image)}
            >
              {l('edit')}
            </Button>
          )}
        />
      </Styled.Table>
      {editingImage && (
        <ManagedImageModal
          image={editingImage}
          onClose={() => setEditingImage(undefined)}
        />
      )}
    </>
  );
};

export default ManagedImagesTable;
