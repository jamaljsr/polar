import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { ManagedImage } from 'types';
import { dockerConfigs } from 'utils/constants';
import { renderWithProviders, testManagedImages } from 'utils/tests';
import ManagedImageModal from './ManagedImageModal';

describe('ManagedImageModal Component', () => {
  let unmount: () => void;
  const onClose = jest.fn();

  const renderComponent = () => {
    const nodeImages = {
      managed: [
        ...testManagedImages,
        // add a dummy image
        { implementation: 'LND', version: 'test', command: 'test-lnd-command' },
      ] as ManagedImage[],
    };
    const initialState = {
      app: {
        settings: {
          nodeImages,
        },
      },
    };

    const image = nodeImages.managed[6];
    const result = renderWithProviders(
      <ManagedImageModal image={image} onClose={onClose} />,
      { initialState },
    );
    unmount = result.unmount;
    return {
      ...result,
      image,
    };
  };

  afterEach(() => unmount());

  it('should display title', () => {
    const { getByText } = renderComponent();
    expect(getByText(/Customize Managed Node - */)).toBeInTheDocument();
  });

  it('should display form fields', () => {
    const { getByText } = renderComponent();
    expect(getByText('Docker Image')).toBeInTheDocument();
    expect(getByText('Command')).toBeInTheDocument();
  });

  it('should display footer buttons', () => {
    const { getByText } = renderComponent();
    expect(getByText('Reset to Default')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    expect(getByText('Save')).toBeInTheDocument();
  });

  it('should display the command variables', () => {
    const { getByText, image } = renderComponent();
    expect(getByText('Command Variable Substitutions')).toBeInTheDocument();
    fireEvent.click(getByText('Command Variable Substitutions'));
    const vars = dockerConfigs[image.implementation].variables;
    vars.forEach(v => {
      expect(getByText(v)).toBeInTheDocument();
    });
  });

  it('should have form fields populated', () => {
    const { getByDisplayValue, image } = renderComponent();
    const { implementation, version } = image;
    const { imageName } = dockerConfigs[implementation];
    expect(getByDisplayValue(`${imageName}:${version}`)).toBeInTheDocument();
    expect(getByDisplayValue(image.command)).toBeInTheDocument();
  });

  it('should save the managed image', async () => {
    const { getByText, getByLabelText, store } = renderComponent();
    fireEvent.change(getByLabelText('Command'), { target: { value: 'a' } });
    fireEvent.click(getByText('Save'));
    await waitFor(() => {
      expect(store.getState().app.settings.nodeImages.managed[6].command).toBe('a');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should reset the managed image to default', async () => {
    const { getByText, store } = renderComponent();
    fireEvent.click(getByText('Reset to Default'));
    await waitFor(() => {
      expect(store.getState().app.settings.nodeImages.managed[6]).toBeUndefined();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should display an error notification if saving fails', async () => {
    onClose.mockImplementation(() => {
      throw new Error('test-error');
    });
    const { getByText, findByText } = renderComponent();
    fireEvent.click(getByText('Save'));
    expect(await findByText('Failed to update the Node Image')).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });
});
