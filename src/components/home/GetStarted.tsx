import React from 'react';
import { Link } from 'react-router-dom';
import { CloudSyncOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { NETWORK_NEW } from 'components/routing';
import logobw from 'resources/logo_bw.png';

const Styled = {
  GetStarted: styled.div`
    width: 100%;
    height: 100%;
    background-image: url(${logobw});
    background-size: contain;
    background-position: center center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `,
  Header: styled.h1`
    font-size: 44px;
    font-weight: 300;
    margin-bottom: 30px;
  `,
  ImportLink: styled(Link)`
    margin-top: 15px;
  `,
  UpdatesButton: styled(Button)`
    margin-top: 30px;
  `,
};

const GetStarted: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.home.GetStarted');
  const { showImageUpdates } = useStoreActions(s => s.modals);
  const toggleModal = () => showImageUpdates();

  return (
    <Styled.GetStarted>
      <Styled.Header>{l('title')}</Styled.Header>
      <Link to={NETWORK_NEW}>
        <Button type="primary" size="large">
          {l('createBtn')}
        </Button>
      </Link>
      <Styled.UpdatesButton
        type="link"
        block
        icon={<CloudSyncOutlined />}
        onClick={toggleModal}
      >
        {l('checkUpdates')}
      </Styled.UpdatesButton>
    </Styled.GetStarted>
  );
};

export default GetStarted;
