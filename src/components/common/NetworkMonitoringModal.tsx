import React, { useEffect, useState, useRef } from 'react';
import { Modal, Typography, Button, Input, Form, Select, Alert, Pagination } from 'antd';
import ReactJson from 'react-json-view';
import { useStoreActions, useStoreState } from 'store';
import { networksPath } from 'utils/config';
import usePrefixedTranslation from 'hooks/usePrefixedTranslation';
import { fileService } from 'utils/fileService';

// Remove getElectronDeps and all direct window.require usage

const { Text, Title } = Typography;

interface NetworkMonitoringModalProps {
  networkId: number;
  testLoading?: boolean;
  testJsonData?: any;
  testIsRunning?: boolean; // <-- add this for testing
}

// Helper to get the correct JSON file path
const getJsonFilePath = (networkId: number, configExists: boolean) => {
  const base = `${networksPath}/${networkId}/volumes/shared_data`;
  return configExists ? `${base}/filtered.json` : `${base}/output.json`;
};

// Helper to get the correct PCAP file path and name
const getPcapFileInfo = (networkId: number, configExists: boolean) => {
  const base = `${networksPath}/${networkId}/volumes/shared_data`;
  if (configExists) {
    const pcapPath = `${base}/filtered.pcap`;
    if (fileService.existsSync(pcapPath))
      return { path: pcapPath, name: 'filtered.pcap' };
  }
  const pcapPath = `${base}/merged.pcap`;
  if (fileService.existsSync(pcapPath)) return { path: pcapPath, name: 'merged.pcap' };
  return null;
};

const fetchJsonData = async (
  setJsonData: React.Dispatch<React.SetStateAction<any>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  networkId: number,
  configExists: boolean,
  isMountedRef?: React.MutableRefObject<boolean>,
) => {
  setLoading(true);
  const jsonFilePath = getJsonFilePath(networkId, configExists);
  if (fileService.existsSync(jsonFilePath)) {
    const fileContent = fileService.readFileSync(jsonFilePath, 'utf-8');
    let parsed;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      parsed = null;
    }
    if (!isMountedRef || isMountedRef.current) {
      setJsonData(parsed);
      setLoading(false);
    }
  } else {
    if (!isMountedRef || isMountedRef.current) {
      setJsonData(null);
      setLoading(false);
    }
  }
};

const configFilePath = (networkId: number) => {
  return `${networksPath}/${networkId}/volumes/shared_data/config.json`;
};

const checkConfigExists = (networkId: number) => {
  return fileService.existsSync(configFilePath(networkId));
};

const loadConfigFromFile = (networkId: number) => {
  try {
    const filePath = configFilePath(networkId);
    if (fileService.existsSync(filePath)) {
      const fileContent = fileService.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to load config.json:', err);
  }
  return null;
};

const packetTypeOptions = ['tcp', 'udp', 'icmp', 'arp']; // Predefined packet types

const renderJsonData = (
  data: any,
  expandedState: boolean[],
  toggleExpanded: (index: number) => void,
  l: (key: string) => string,
) => {
  if (!Array.isArray(data))
    return <Text type="secondary">{l('monitoringNoDataAvailable')}</Text>;

  return (
    <div
      style={{
        maxHeight: '50vh',
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        background: '#1f1f1f', // Match modal background
      }}
    >
      {data.map((item: any, index: number) => {
        const layers = item?._source?.layers || {};
        const summary = {
          utcTime: layers?.frame?.['frame.time'] || 'N/A',
          srcIp: layers?.ip?.['ip.src'] || 'N/A',
          dstIp: layers?.ip?.['ip.dst'] || 'N/A',
          messageType: layers?.frame?.['frame.protocols']?.split(':').pop() || 'N/A',
          packetSize: layers?.frame?.['frame.len'] || 'N/A', // Add packet size
        };

        return (
          <div
            key={index}
            style={{
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              padding: '10px',
              background: '#2d2d2d', // Slightly lighter background for each item
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#1890ff',
              }}
              onClick={() => toggleExpanded(index)}
            >
              {expandedState[index] ? '\u25bc' : '\u25b6'}{' '}
              <span style={{ color: '#ffcc00' }}>{l('monitoringSummaryUtcTime')}</span>{' '}
              <span style={{ color: '#f0f0f0', fontWeight: 'normal' }}>
                {summary.utcTime}
              </span>
              , <span style={{ color: '#ffcc00' }}>{l('monitoringSummarySrcIp')}</span>{' '}
              <span style={{ color: '#66ff66', fontWeight: 'normal' }}>
                {summary.srcIp}
              </span>
              , <span style={{ color: '#ffcc00' }}>{l('monitoringSummaryDstIp')}</span>{' '}
              <span style={{ color: '#66ccff', fontWeight: 'normal' }}>
                {summary.dstIp}
              </span>
              ,{' '}
              <span style={{ color: '#ffcc00' }}>
                {l('monitoringSummaryMessageType')}
              </span>{' '}
              <span style={{ color: '#ff9966', fontWeight: 'normal' }}>
                {summary.messageType}
              </span>
              ,{' '}
              <span style={{ color: '#ffcc00' }}>{l('monitoringSummaryPacketSize')}</span>{' '}
              <span style={{ color: '#f0f0f0', fontWeight: 'normal' }}>
                {summary.packetSize}
              </span>
            </div>
            {expandedState[index] && (
              <div
                style={{
                  marginTop: '10px',
                  background: '#1f1f1f', // Match modal background
                  padding: '10px',
                  borderRadius: '5px',
                  overflowX: 'auto',
                }}
              >
                <ReactJson
                  src={item}
                  collapsed={3} // Collapse nodes at the fourth level onwards
                  enableClipboard={true} // Allow copying to clipboard
                  theme={{
                    base00: '#1f1f1f', // Match modal background
                    base01: '#2d2d2d', // Slightly lighter background for nested elements
                    base02: '#3c3c3c', // Borders
                    base03: '#c5c5c5', // Comments, keys (light gray)
                    base04: '#f0f0f0', // Strings (white)
                    base05: '#ffcc00', // Numbers (yellow)
                    base06: '#ff6666', // Booleans (red)
                    base07: '#66ff66', // Null (green)
                    base08: '#66ccff', // Undefined (blue)
                    base09: '#ff9966', // Additional color for customization (orange)
                    base0A: '#ff66ff', // Additional color for customization (pink)
                    base0B: '#66ffff', // Additional color for customization (cyan)
                    base0C: '#ffff66', // Additional color for customization (light yellow)
                    base0D: '#cc99ff', // Additional color for customization (purple)
                    base0E: '#99ccff', // Additional color for customization (light blue)
                    base0F: '#999999', // Additional color for customization (gray)
                  }} // Custom theme for dark background
                  displayDataTypes={false} // Hide data types for cleaner display
                  name={false} // Hide the root key
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const extractTsharkError = (msg: string): string => {
  // Find the part after "tshark:"
  const tsharkIdx = msg.indexOf('tshark:');
  if (tsharkIdx === -1) return msg;
  let error = msg.slice(tsharkIdx + 7).trim();
  // Remove anything after a line that starts with "(" (the filter expression)
  const filterIdx = error.search(/\(.*\)\s*\^/);
  if (filterIdx !== -1) {
    error = error.slice(0, filterIdx).trim();
  }
  // Remove trailing lines after a newline if present
  const newlineIdx = error.indexOf('\n');
  if (newlineIdx !== -1) {
    error = error.slice(0, newlineIdx).trim();
  }
  return error;
};

// Helper function to check monitoring status from backend
const checkMonitoringStatus = async (networkId: number): Promise<boolean> => {
  try {
    const port = `39${networkId.toString().padStart(3, '0')}`;
    const response = await fetch(`http://localhost:${port}/status`, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      return data.isMonitoringActive || false;
    }
  } catch (error) {
    console.error('Error checking monitoring status:', error);
  }
  return false;
};

const NetworkMonitoringModal: React.FC<NetworkMonitoringModalProps> = ({
  networkId,
  testLoading,
  testJsonData,
  testIsRunning,
}) => {
  const { l } = usePrefixedTranslation('cmps.common.NetworkMonitoringModal');
  const { visible } = useStoreState(s => s.modals.networkMonitoring);
  const { hideNetworkMonitoring } = useStoreActions(s => s.modals);
  const network = useStoreState(s => {
    try {
      return s.network.networkById?.(networkId);
    } catch {
      return undefined;
    }
  });

  const [jsonData, setJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false); // Track start/stop state
  const [isConfigMode, setIsConfigMode] = useState(false); // Track if in configuration mode
  const [config, setConfig] = useState({
    ip: '',
    port: '',
    protocol: '', // use protocol only
    sourceIp: '',
    destinationIp: '',
    sourcePort: '',
    destinationPort: '',
    packetSizeMin: '',
    packetSizeMax: '',
    timeRange: '',
    tcpFlags: '',
    payloadContent: '',
    macAddress: '',
  }); // Store configuration fields
  const [expandedState, setExpandedState] = useState<boolean[]>([]);
  const [configExists, setConfigExists] = useState(false);
  const [isBusy, setIsBusy] = useState(false); // Unified busy state
  const [configErrorMsg, setConfigErrorMsg] = useState<string | null>(null);

  // Track which PCAP file is being used
  const [pcapFileName, setPcapFileName] = useState<string | null>(null);

  // Ref to track the previous value of isConfigMode
  const prevConfigMode = useRef(false);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  const networkStatus = network?.status;

  useEffect(() => {
    if (!network && visible) {
      hideNetworkMonitoring();
    }
  }, [network, visible, hideNetworkMonitoring]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Always check config and load files together when modal is opened
  useEffect(() => {
    if (visible) {
      const configNowExists = checkConfigExists(networkId);
      setConfigExists(configNowExists);
      fetchJsonData(setJsonData, setLoading, networkId, configNowExists, isMountedRef);
      const pcapInfo = getPcapFileInfo(networkId, configNowExists);
      setPcapFileName(pcapInfo ? pcapInfo.name : null);
      // Check the current monitoring status from backend
      checkMonitoringStatus(networkId).then(actualStatus => {
        setIsRunning(actualStatus);
      });
    }
    // Optionally, clear data when modal closes
    if (!visible) {
      setJsonData(null);
      setExpandedState([]);
    }
  }, [visible, networkId]);

  useEffect(() => {
    if (Array.isArray(jsonData)) {
      setExpandedState(new Array(jsonData.length).fill(false));
      setPage(1); // Reset to first page when data changes
    }
  }, [jsonData]);

  useEffect(() => {
    // Only load config from file when entering config mode
    if (isConfigMode && !prevConfigMode.current) {
      if (configExists) {
        const loaded = loadConfigFromFile(networkId);
        if (loaded) setConfig({ ...config, ...loaded });
      } else {
        setConfig({
          ip: '',
          port: '',
          protocol: '',
          sourceIp: '',
          destinationIp: '',
          sourcePort: '',
          destinationPort: '',
          packetSizeMin: '',
          packetSizeMax: '',
          timeRange: '',
          tcpFlags: '',
          payloadContent: '',
          macAddress: '',
        });
      }
    }
    prevConfigMode.current = isConfigMode;
  }, [isConfigMode, configExists, networkId]);

  // Sync isRunning with network status: if network is stopped, monitoring must be stopped
  useEffect(() => {
    if (networkStatus === 3 /* Status.Stopped */ && isRunning) {
      setIsRunning(false);
    }
  }, [networkStatus, isRunning]);

  const handleStartStop = async () => {
    setIsBusy(true);
    const port = `39${networkId.toString().padStart(3, '0')}`; // Dynamically calculate port
    const url = isRunning
      ? `http://localhost:${port}/stop` // Stop command
      : `http://localhost:${port}/start`; // Start command

    try {
      const response = await fetch(url, { method: 'GET', mode: 'no-cors' }); // Set mode to 'no-cors'
      if (response.ok || response.type === 'opaque') {
        console.log('State toggled successfully');
        if (isRunning) {
          // Stop mode: Reload JSON data
          await fetchJsonData(setJsonData, setLoading, networkId, configExists);
        } else {
          // Start mode: Clear JSON data
          setJsonData(null);
        }
        setIsRunning(!isRunning); // Toggle state on success
      } else {
        console.error('Failed to toggle state:', response.statusText);
      }
    } catch (error) {
      console.error('Error during request:', error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsBusy(true);
    setConfigErrorMsg(null);
    const port = `39${networkId.toString().padStart(3, '0')}`;
    const url = `http://localhost:${port}/config`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.status === 422) {
        const data = await response.json();
        let errorMsg = data?.error || 'Configuration saved but filtering failed';
        errorMsg = extractTsharkError(errorMsg);
        setConfigErrorMsg(errorMsg);
        setConfigExists(true);
        fetchJsonData(setJsonData, setLoading, networkId, false, isMountedRef);
      } else if (response.ok) {
        setConfigErrorMsg(null);
        setConfigExists(true);
        fetchJsonData(setJsonData, setLoading, networkId, true, isMountedRef);
      } else {
        console.error('Failed to save configuration:', response.statusText);
      }
    } catch (error) {
      console.error('Error during configuration save:', error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleClearConfig = async () => {
    setIsBusy(true);
    const port = `39${networkId.toString().padStart(3, '0')}`;
    const url = `http://localhost:${port}/cleanConf`;
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        console.log('Configuration and filtered files cleaned.');
        setConfigExists(false);
        // Reload JSON data after config is cleared
        fetchJsonData(setJsonData, setLoading, networkId, false, isMountedRef);
      } else {
        console.error('Failed to clean configuration:', response.statusText);
      }
    } catch (error) {
      console.error('Error during configuration clean:', error);
    } finally {
      // Always clear the form fields, regardless of fetch result
      setConfig({
        ip: '',
        port: '',
        protocol: '',
        sourceIp: '',
        destinationIp: '',
        sourcePort: '',
        destinationPort: '',
        packetSizeMin: '',
        packetSizeMax: '',
        timeRange: '',
        tcpFlags: '',
        payloadContent: '',
        macAddress: '',
      });
      setIsBusy(false);
    }
  };

  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Helper: get selected types as lowercase array from protocol
  const selectedTypes = config.protocol
    ? config.protocol.split(',').map(t => t.trim().toLowerCase())
    : [];

  const isTcpSelected = selectedTypes.includes('tcp');
  const isUdpSelected = selectedTypes.includes('udp');
  const isPortRelevant = isTcpSelected || isUdpSelected;

  const toggleExpanded = (index: number) => {
    setExpandedState(prevState => {
      const newState = [...prevState];
      newState[index] = !prevState[index];
      return newState;
    });
  };

  // Store Monitoring handler
  const handleStoreMonitoring = async () => {
    // Dialog abstraction for Electron, fallback to alert in browser/tests
    const dialog =
      typeof window !== 'undefined' && window.require
        ? window.require('electron').remote
          ? window.require('electron').remote.dialog
          : window.require('electron').dialog
        : null;

    const pcapInfo = getPcapFileInfo(networkId, configExists);
    if (!pcapInfo) {
      if (dialog) {
        dialog.showErrorBox(
          'No PCAP file found',
          'There is no filtered.pcap or merged.pcap to store.',
        );
      } else {
        alert('No PCAP file found. There is no filtered.pcap or merged.pcap to store.');
      }
      return;
    }
    if (dialog) {
      const result = await dialog.showSaveDialog({
        title: 'Save Monitoring PCAP',
        defaultPath: pcapInfo.name,
        filters: [{ name: 'PCAP Files', extensions: ['pcap'] }],
      });
      if (!result.canceled && result.filePath) {
        try {
          fileService.copyFileSync(pcapInfo.path, result.filePath);
          dialog.showMessageBox({
            message: 'PCAP file saved successfully.',
            buttons: ['OK'],
          });
        } catch (err) {
          dialog.showErrorBox('Error', 'Failed to save the PCAP file.');
        }
      }
    } else {
      // Fallback: just alert in browser/tests
      alert('PCAP file save dialog is not available in this environment.');
    }
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Pagination logic for JSON data
  const paginatedJsonData = Array.isArray(jsonData)
    ? jsonData.slice((page - 1) * pageSize, page * pageSize)
    : jsonData;

  // Use test overrides if provided
  const effectiveLoading = typeof testLoading === 'boolean' ? testLoading : loading;
  const effectiveJsonData = typeof testJsonData !== 'undefined' ? testJsonData : jsonData;
  const effectiveIsRunning =
    typeof testIsRunning === 'boolean' ? testIsRunning : isRunning;
  const paginatedEffectiveJsonData = Array.isArray(effectiveJsonData)
    ? effectiveJsonData.slice((page - 1) * pageSize, page * pageSize)
    : paginatedJsonData;

  // Place the guard here, after all hooks
  if (!network) {
    return null;
  }

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hideNetworkMonitoring()}
      footer={null}
      destroyOnClose
      width={'80%'}
      bodyStyle={{
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      <Title level={4}> {isConfigMode ? l('configTitle') : l('monitoringTitle')}</Title>
      <Text>
        {isConfigMode
          ? l('configDescription')
          : pcapFileName
          ? l('monitoringDescription', { pcapFileName })
          : l('monitoringDefaultDescription')}
      </Text>
      <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
        {!isConfigMode && (
          <>
            <Button type="primary" onClick={handleStartStop} disabled={isBusy}>
              {effectiveIsRunning
                ? l('monitoringButtonStop')
                : l('monitoringButtonStart')}
            </Button>
            <Button type="default" onClick={handleStoreMonitoring} disabled={isBusy}>
              {l('monitoringButtonStoreMonitoring')}
            </Button>
          </>
        )}
        <Button
          type="default"
          onClick={() => setIsConfigMode(!isConfigMode)} // Toggle configuration mode
          disabled={isBusy}
        >
          {isConfigMode ? l('configButtonChange') : l('monitoringButtonChange')}
        </Button>
        {isConfigMode && (
          <>
            <Button
              type="primary"
              onClick={handleSaveConfig} // Save configuration changes
              disabled={isBusy}
            >
              {l('configButtonSave')}
            </Button>
            {configExists && (
              <Button type="default" danger onClick={handleClearConfig} disabled={isBusy}>
                {l('configButtonClear')}
              </Button>
            )}
          </>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        {isConfigMode ? (
          <>
            {configErrorMsg && (
              <Alert
                message={l('configError', { error: configErrorMsg })}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form layout="vertical">
              <Form.Item label={l('configFieldsIp')}>
                <Input
                  value={config.ip}
                  onChange={e => handleConfigChange('ip', e.target.value)}
                  placeholder={l('configFieldsIpPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsPort')} hidden={!isPortRelevant}>
                <Input
                  value={config.port}
                  onChange={e => handleConfigChange('port', e.target.value)}
                  placeholder={l('configFieldsPortPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsProtocol')}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder={l('configFieldsProtocolPlaceholder')}
                  value={config.protocol ? config.protocol.split(', ') : []}
                  onChange={(values: string[]) =>
                    handleConfigChange('protocol', values.join(', '))
                  }
                  options={packetTypeOptions.map(type => ({ value: type, label: type }))}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsSourceIp')}>
                <Input
                  value={config.sourceIp}
                  onChange={e => handleConfigChange('sourceIp', e.target.value)}
                  placeholder={l('configFieldsSourceIpPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsDestinationIp')}>
                <Input
                  value={config.destinationIp}
                  onChange={e => handleConfigChange('destinationIp', e.target.value)}
                  placeholder={l('configFieldsDestinationIpPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsSourcePort')} hidden={!isPortRelevant}>
                <Input
                  value={config.sourcePort}
                  onChange={e => handleConfigChange('sourcePort', e.target.value)}
                  placeholder={l('configFieldsSourcePortPlaceholder')}
                />
              </Form.Item>
              <Form.Item
                label={l('configFieldsDestinationPort')}
                hidden={!isPortRelevant}
              >
                <Input
                  value={config.destinationPort}
                  onChange={e => handleConfigChange('destinationPort', e.target.value)}
                  placeholder={l('configFieldsDestinationPortPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsPacketSizeMin')}>
                <Input
                  value={config.packetSizeMin}
                  onChange={e => handleConfigChange('packetSizeMin', e.target.value)}
                  placeholder={l('configFieldsPacketSizeMinPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsPacketSizeMax')}>
                <Input
                  value={config.packetSizeMax}
                  onChange={e => handleConfigChange('packetSizeMax', e.target.value)}
                  placeholder={l('configFieldsPacketSizeMaxPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsTimeRange')}>
                <Input
                  value={config.timeRange}
                  onChange={e => handleConfigChange('timeRange', e.target.value)}
                  placeholder={l('configFieldsTimeRangePlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsTcpFlags')} hidden={!isTcpSelected}>
                <Input
                  value={config.tcpFlags}
                  onChange={e => handleConfigChange('tcpFlags', e.target.value)}
                  placeholder={l('configFieldsTcpFlagsPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsPayloadContent')} hidden={!isUdpSelected}>
                <Input
                  value={config.payloadContent}
                  onChange={e => handleConfigChange('payloadContent', e.target.value)}
                  placeholder={l('configFieldsPayloadContentPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={l('configFieldsMacAddress')}>
                <Input
                  value={config.macAddress}
                  onChange={e => handleConfigChange('macAddress', e.target.value)}
                  placeholder={l('configFieldsMacAddressPlaceholder')}
                />
              </Form.Item>
            </Form>
          </>
        ) : effectiveLoading ? (
          <Text type="secondary">{l('monitoringLoading')}</Text>
        ) : Array.isArray(effectiveJsonData) ? (
          effectiveJsonData.length === 0 ? (
            <Alert
              message={l('monitoringNoPacketsMatch')}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          ) : (
            <>
              <div
                style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span>{l('monitoringPageSize')}:</span>
                <Select
                  value={pageSize}
                  style={{ width: 100 }}
                  onChange={val => setPageSize(val)}
                  options={[50, 100, 500, 1000].map(size => ({
                    value: size,
                    label: size,
                  }))}
                />
                <span style={{ marginLeft: 'auto' }}>
                  {l('monitoringTotalPackets')} {effectiveJsonData.length}
                </span>
              </div>
              {renderJsonData(
                paginatedEffectiveJsonData,
                expandedState,
                toggleExpanded,
                l,
              )}
              <Pagination
                current={page}
                pageSize={pageSize}
                total={effectiveJsonData.length}
                onChange={setPage}
                showSizeChanger={false}
                style={{ marginTop: 12, textAlign: 'center' }}
              />
            </>
          )
        ) : isRunning ? (
          <Alert
            message={l('monitoringActive')}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        ) : (
          <Alert
            message={l('monitoringNoPacketData')}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </Modal>
  );
};

export default NetworkMonitoringModal;
