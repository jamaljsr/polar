import React, { useEffect, useState } from 'react';
import { info } from 'electron-log';
import { PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Button, PageHeader } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { CustomImage } from 'types';
import { dockerConfigs } from 'utils/constants';
import { HOME } from 'components/routing';
import { CustomImageModal, CustomImagesTable, ManagedImagesTable } from './';

const Styled = {
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 16px;
    flex: 0;
  `,
};

const NodeImagesView: React.FC = () => {
  useEffect(() => info('Rendering NodeImagesView component'), []);
  const { l } = usePrefixedTranslation('cmps.nodeImages.NodeImagesView');

  const theme = useTheme();
  const [addingImage, setAddingImage] = useState<CustomImage>();
  const { computedManagedImages, settings } = useStoreState(s => s.app);
  const { navigateTo } = useStoreActions(s => s.app);

  const handleAdd = () => {
    setAddingImage({
      id: '',
      name: '',
      implementation: 'LND',
      dockerImage: '',
      command: dockerConfigs.LND.command,
    });
  };

  return (
    <>
      <Styled.PageHeader
        title={l('title')}
        colors={theme.pageHeader}
        onBack={() => navigateTo(HOME)}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {l('addBtn')}
          </Button>
        }
      />
      <Alert type="warning" message={l('warnMsg')} description={l('warnDesc')} showIcon />

      <CustomImagesTable images={settings.nodeImages.custom} />
      <ManagedImagesTable images={computedManagedImages} />
      {addingImage && (
        <CustomImageModal image={addingImage} onClose={() => setAddingImage(undefined)} />
      )}
    </>
  );
};

export default NodeImagesView;
