import React from 'react';
import { fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { CustomImage } from 'types';
import { DOCKER_REPO, dockerConfigs } from 'utils/constants';
import { injections, renderWithProviders, testCustomImages } from 'utils/tests';
import CustomImageModal from './CustomImageModal';

const dockerServiceMock = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('CustomImageModal Component', () => {
  let unmount: () => void;

  const onClose = jest.fn();
  const newImage: CustomImage = {
    id: '',
    name: '',
    implementation: 'LND',
    dockerImage: '',
    command: dockerConfigs.LND.command,
  };

  const renderComponent = async (customImage?: CustomImage) => {
    const nodeImages = {
      custom: testCustomImages,
    };
    const initialState = {
      app: {
        settings: {
          nodeImages,
        },
      },
    };

    const image = customImage || nodeImages.custom[0];
    const result = renderWithProviders(
      <CustomImageModal image={image} onClose={onClose} />,
      { initialState },
    );
    unmount = result.unmount;
    // wait for the loader to go away
    await waitForElementToBeRemoved(() => result.getByLabelText('loading'));
    return {
      ...result,
      image,
    };
  };

  beforeEach(() => {
    dockerServiceMock.getImages.mockResolvedValue(['aaa', 'bbb', `${DOCKER_REPO}/lnd`]);
  });

  afterEach(() => unmount());

  it('should display title and notice', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Custom Node Details')).toBeInTheDocument();
    expect(
      getByText(
        'Editing this information will not modify any nodes in existing networks',
      ),
    ).toBeInTheDocument();
  });

  it('should display form fields', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Name')).toBeInTheDocument();
    expect(getByText('Docker Image')).toBeInTheDocument();
    expect(getByText('Command')).toBeInTheDocument();
  });

  it('should display the command variables', async () => {
    const { getByText, image } = await renderComponent();
    expect(getByText('Command Variable Substitutions')).toBeInTheDocument();
    fireEvent.click(getByText('Command Variable Substitutions'));
    const vars = dockerConfigs[image.implementation].variables;
    vars.forEach(v => {
      expect(getByText(v)).toBeInTheDocument();
    });
  });

  it('should have form fields populated', async () => {
    const { getByDisplayValue, image } = await renderComponent();
    expect(getByDisplayValue(image.dockerImage)).toBeInTheDocument();
    expect(getByDisplayValue(image.command)).toBeInTheDocument();
  });

  it('should update the command field when the implementation is changed', async () => {
    const { getByLabelText, changeSelect } = await renderComponent(newImage);
    const impl = getByLabelText('Command') as HTMLTextAreaElement;
    expect(impl.value).toContain('lnd');
    changeSelect('Implementation', 'Eclair');
    expect(impl.value).toContain('polar-eclair');
  });

  it('should display an error notification if fetching docker images fails', async () => {
    dockerServiceMock.getImages.mockRejectedValue(new Error('test-error'));
    const { findByText } = await renderComponent();
    expect(
      await findByText('Failed to fetch the list of docker images'),
    ).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });

  it('should save the managed image', async () => {
    const { getByText, getByLabelText, store } = await renderComponent();
    fireEvent.change(getByLabelText('Command'), { target: { value: 'a' } });
    fireEvent.click(getByText('Save'));
    await waitFor(() => {
      expect(store.getState().app.settings.nodeImages.custom[0].command).toBe('a');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should display an error notification if saving fails', async () => {
    onClose.mockImplementation(() => {
      throw new Error('test-error');
    });
    const { getByText, findByText } = await renderComponent();
    fireEvent.click(getByText('Save'));
    expect(await findByText('Failed to update the Node Image')).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });
});
