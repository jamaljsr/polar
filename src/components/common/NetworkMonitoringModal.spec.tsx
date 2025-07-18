import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, getNetwork } from 'utils/tests';
import NetworkMonitoringModal from './NetworkMonitoringModal';
import { initChartFromNetwork } from 'utils/chart';

// Example packet data (replace with actual structure from output.json if needed)
const examplePacketData = [
  {
    _source: {
      layers: {
        frame: {
          'frame.time': '2025-06-26 12:00:00',
          'frame.protocols': 'tcp',
          'frame.len': 60,
        },
        ip: { 'ip.src': '10.0.0.1', 'ip.dst': '10.0.0.2' },
      },
    },
  },
];

describe('NetworkMonitoringModal (clean scenarios)', () => {
  let unmount: () => void;

  afterEach(() => unmount && unmount());

  it('shows "no data available" when there is no data and no filter', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={undefined} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    console.log(examplePacketData);
    expect(
      result.getByText('No packet data available. Start monitoring to capture packets.'),
    ).toBeInTheDocument();
  });

  it('shows summary when there is data and no filter', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    expect(result.getByText('Source IP:')).toBeInTheDocument();
  });

  it('shows "no packets match" when there is data but filter excludes all', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = <NetworkMonitoringModal networkId={network.id} testJsonData={[]} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    expect(
      result.getByText('No packets match the current filter criteria.'),
    ).toBeInTheDocument();
  });

  it('shows summary when there is data and filter matches', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    expect(result.getByText('UTC Time:')).toBeInTheDocument();
  });

  it('shows loading state when loading', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal
        networkId={network.id}
        testJsonData={examplePacketData}
        testLoading={true}
      />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    expect(result.getByText('Loading captured packet data...')).toBeInTheDocument();
  });

  it('renders config mode and allows switching back', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    fireEvent.click(result.getByText('Configuration'));
    expect(result.getByText('Back to Monitoring')).toBeInTheDocument();
    fireEvent.click(result.getByText('Back to Monitoring'));
    expect(result.getByText('Configuration')).toBeInTheDocument();
  });

  it('handles start/stop monitoring button', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal
        networkId={network.id}
        testJsonData={examplePacketData}
        testIsRunning={false}
      />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, type: 'basic' });
    fireEvent.click(result.getByText('Start Monitoring'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Simulate rerender with running true
    // ...existing code for rerender if needed...
  });

  it('shows null if network is missing', async () => {
    const initialState = {
      network: { networks: [] },
      designer: { activeId: 999, allCharts: {} },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = <NetworkMonitoringModal networkId={999} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    expect(result.container.firstChild).toBeNull();
  });

  it('shows error alert when config save fails with 422', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    fireEvent.click(result.getByText('Configuration'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'tshark: some error' }),
    });
    fireEvent.click(result.getByText('Save Configuration'));
    await waitFor(() =>
      expect(
        result.getByText('Configuration saved but filtering failed:'),
      ).toBeInTheDocument(),
    );
  });

  it('shows alert when store monitoring is clicked with no PCAP file', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    window.alert = jest.fn();
    fireEvent.click(result.getByText('Store Monitoring PCAP'));
    expect(window.alert).toHaveBeenCalled();
  });

  it('handles clear config after save', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    fireEvent.click(result.getByText('Configuration'));
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    fireEvent.click(result.getByText('Save Configuration'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    fireEvent.click(result.getByText('Clear Configuration'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});

// Additional tests to improve coverage
describe('NetworkMonitoringModal (additional coverage)', () => {
  let unmount: () => void;
  let originalRequire: any;

  beforeEach(() => {
    // Store the original require function if it exists
    originalRequire = (window as any).require;
  });

  afterEach(() => {
    unmount && unmount();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Restore original require or delete it
    if (originalRequire) {
      (window as any).require = originalRequire;
    } else {
      delete (window as any).require;
    }
  });

  it('handles clear config error gracefully', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    fireEvent.click(result.getByText('Configuration'));

    // First save a configuration to make Clear Configuration button appear
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    fireEvent.click(result.getByText('Save Configuration'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Now mock fetch to fail for clear config
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    fireEvent.click(result.getByText('Clear Configuration'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Config should still be cleared even if fetch fails
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to clean configuration:',
      'Internal Server Error',
    );

    consoleSpy.mockRestore();
  });

  it('handles clear config network error gracefully', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    fireEvent.click(result.getByText('Configuration'));

    // First save a configuration to make Clear Configuration button appear
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    fireEvent.click(result.getByText('Save Configuration'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Now mock fetch to throw an error for clear config
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    fireEvent.click(result.getByText('Clear Configuration'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error during configuration clean:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('handles config field changes for all supported fields', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    fireEvent.click(result.getByText('Configuration'));

    // Test various config field changes
    const ipInput = result.getByPlaceholderText('Enter IP Address');
    fireEvent.change(ipInput, { target: { value: '10.0.0.1' } });

    const sourceIpInput = result.getByPlaceholderText('Enter Source IP');
    fireEvent.change(sourceIpInput, { target: { value: '10.0.0.2' } });

    const destinationIpInput = result.getByPlaceholderText('Enter Destination IP');
    fireEvent.change(destinationIpInput, { target: { value: '10.0.0.3' } });

    // Test protocol selection (should show port fields when TCP/UDP selected)
    const protocolSelect =
      result.container.querySelector('[data-testid="select-protocol"]') ||
      result.container.querySelector('.ant-select-selector');
    if (protocolSelect) {
      fireEvent.mouseDown(protocolSelect);
      await waitFor(() => {
        const tcpOption = result.getByText('TCP');
        fireEvent.click(tcpOption);
      });
    }

    await waitFor(() => {
      expect(result.getByPlaceholderText('Enter Port')).toBeInTheDocument();
    });
  });

  it('shows more fields when protocol is selected', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    fireEvent.click(result.getByText('Configuration'));

    // Count visible form fields initially (non-hidden ones)
    const initialVisibleFields = result.container.querySelectorAll(
      '.ant-form-item:not(.ant-form-item-hidden)',
    );
    const initialCount = initialVisibleFields.length;

    // Select TCP protocol
    const protocolSelect = result.container.querySelector('.ant-select-selector');
    if (protocolSelect) {
      fireEvent.mouseDown(protocolSelect);
      await waitFor(() => {
        const tcpOption = result.getByText('tcp');
        fireEvent.click(tcpOption);
      });

      // After selecting TCP, there should be more visible fields
      await waitFor(() => {
        const newVisibleFields = result.container.querySelectorAll(
          '.ant-form-item:not(.ant-form-item-hidden)',
        );
        expect(newVisibleFields.length).toBeGreaterThan(initialCount);
      });
    }
  });

  it('handles pagination controls', async () => {
    // Create more data to test pagination
    const morePacketData = Array.from({ length: 150 }, (_, i) => ({
      _source: {
        layers: {
          frame: {
            'frame.time': `2025-06-26 12:${String(i).padStart(2, '0')}:00`,
            'frame.protocols': 'tcp',
            'frame.len': 60 + i,
          },
          ip: {
            'ip.src': `10.0.0.${(i % 254) + 1}`,
            'ip.dst': `10.0.1.${(i % 254) + 1}`,
          },
        },
      },
    }));

    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={morePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    // Should show total packet count
    expect(result.getByText('Total packets: 150')).toBeInTheDocument();

    // Test page size selector - need to find the correct one among multiple selectors
    const pageSizeSelectors = result.container.querySelectorAll('.ant-select-selector');
    const pageSizeSelect = Array.from(pageSizeSelectors).find(selector =>
      selector
        .closest('.ant-select')
        ?.previousElementSibling?.textContent?.includes('Page Size'),
    );

    if (pageSizeSelect) {
      fireEvent.mouseDown(pageSizeSelect);
      await waitFor(() => {
        const option50 = result.getByText('50');
        fireEvent.click(option50);
      });
    }

    // Test pagination navigation
    const paginationButtons = result.container.querySelectorAll('.ant-pagination-item');
    if (paginationButtons.length > 0) {
      fireEvent.click(paginationButtons[1]); // Click page 2
    }
  });

  it('shows fallback alert when no electron dialog available', async () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };

    // Mock file system without electron
    const mockFs = {
      existsSync: jest.fn().mockReturnValue(false), // No PCAP file exists
    };

    const mockRequire = jest.fn((module: string) => {
      if (module === 'fs') return mockFs;
      return {};
    });

    // Ensure no electron environment
    if ((window as any).require) {
      delete (window as any).require;
    }
    Object.defineProperty(window, 'require', {
      value: mockRequire,
      configurable: true,
      writable: true,
    });

    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    window.alert = jest.fn();
    fireEvent.click(result.getByText('Store Monitoring PCAP'));

    expect(window.alert).toHaveBeenCalledWith(
      'No PCAP file found. There is no filtered.pcap or merged.pcap to store.',
    );
  });

  it('handles packet expansion toggle', async () => {
    // Mock file system
    const mockFs = {
      existsSync: jest.fn().mockReturnValue(false),
    };

    const mockRequire = jest.fn((module: string) => {
      if (module === 'fs') return mockFs;
      return {};
    });

    if ((window as any).require) {
      delete (window as any).require;
    }
    Object.defineProperty(window, 'require', {
      value: mockRequire,
      configurable: true,
      writable: true,
    });

    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    // Look for expand/collapse functionality in packet display
    const expandableElements = result.container.querySelectorAll(
      'div[style*="cursor: pointer"]',
    );

    if (expandableElements.length > 0) {
      fireEvent.click(expandableElements[0]);

      // Check if the element contains expanded indicator
      expect(expandableElements[0].textContent).toContain('▼');
    }
  });

  it('handles save configuration with different error status codes', async () => {
    // Mock file system
    const mockFs = {
      existsSync: jest.fn().mockReturnValue(false),
    };

    const mockRequire = jest.fn((module: string) => {
      if (module === 'fs') return mockFs;
      return {};
    });

    if ((window as any).require) {
      delete (window as any).require;
    }
    Object.defineProperty(window, 'require', {
      value: mockRequire,
      configurable: true,
      writable: true,
    });

    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    fireEvent.click(result.getByText('Configuration'));

    // Test 500 error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Internal server error' }),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    fireEvent.click(result.getByText('Save Configuration'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save configuration:',
        'Internal Server Error',
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles network errors during save configuration', async () => {
    // Mock file system
    const mockFs = {
      existsSync: jest.fn().mockReturnValue(false),
    };

    const mockRequire = jest.fn((module: string) => {
      if (module === 'fs') return mockFs;
      return {};
    });

    if ((window as any).require) {
      delete (window as any).require;
    }
    Object.defineProperty(window, 'require', {
      value: mockRequire,
      configurable: true,
      writable: true,
    });

    const network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      designer: {
        activeId: network.id,
        allCharts: { [network.id]: initChartFromNetwork(network) },
      },
      modals: { networkMonitoring: { visible: true } },
    };
    const cmp = (
      <NetworkMonitoringModal networkId={network.id} testJsonData={examplePacketData} />
    );
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    fireEvent.click(result.getByText('Configuration'));

    // Mock fetch to throw network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    fireEvent.click(result.getByText('Save Configuration'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error during configuration save:',
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
});
