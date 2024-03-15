import { ipcRenderer } from 'electron';
import { createIpcSender } from './ipcService';

describe('IpcService', () => {
  it('should use the correct channel request name', async () => {
    ipcRenderer.once = jest.fn().mockImplementation((chan, cb) => cb(null, '321'));
    ipcRenderer.send = jest.fn();
    const ipc = createIpcSender('Test Name', 'pre1');
    await ipc('chan1', { node: 123 });
    expect(ipcRenderer.send).toBeCalledWith('pre1-chan1-request', {
      replyTo: expect.stringContaining('pre1-chan1-response'),
      node: 123,
    });
  });

  it('should return the correct value', async () => {
    ipcRenderer.once = jest.fn().mockImplementation((chan, cb) => cb(null, '321'));
    ipcRenderer.send = jest.fn();
    const ipc = createIpcSender('Test Name', 'pre1');
    const result = await ipc('chan1', 123);
    expect(result).toEqual('321');
  });

  it('should fail if an error is returned', async () => {
    const err = 'Something went wrong';
    ipcRenderer.once = jest.fn().mockImplementation((chan, cb) => cb(null, { err }));
    const ipc = createIpcSender('Test Name', 'pre1');
    await expect(ipc('chan1', 123)).rejects.toThrow(err);
  });
});
