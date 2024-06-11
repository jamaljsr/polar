import { ipcRenderer } from 'electron';
import { createIpcSender, createIpcStreamer } from './ipcService';

describe('IpcService', () => {
  it('should use the correct channel request name', async () => {
    ipcRenderer.once = jest.fn().mockImplementation((chan, cb) => cb(null, '321'));
    ipcRenderer.send = jest.fn();
    const ipc = createIpcSender('Test Name', 'pre1');
    await ipc('chan1', { node: 123 });
    expect(ipcRenderer.send).toHaveBeenCalledWith('pre1-chan1-request', {
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

  it('should call the callback function with the correct value', async () => {
    ipcRenderer.send = jest.fn();
    ipcRenderer.on = jest.fn().mockImplementation((chan, cb) => cb(null, '456'));
    const callback = jest.fn();
    const streamer = createIpcStreamer('Test Name', 'pre1');
    streamer.subscribe('chan1', { node: { ports: { rest: 123 } } }, callback);
    expect(ipcRenderer.on).toHaveBeenCalledWith(
      expect.stringContaining('pre1-chan1-stream'),
      callback,
    );
  });

  it('should unsubscribe from the ipc', async () => {
    ipcRenderer.send = jest.fn();
    ipcRenderer.off = jest.fn();
    ipcRenderer.on = jest.fn().mockImplementation((chan, cb) => cb(null, '456'));
    const callback = jest.fn();
    const streamer = createIpcStreamer('Test Name', 'pre1');
    streamer.subscribe('chan1', { node: { ports: { rest: 123 } } }, callback);
    streamer.unsubscribe('chan1', callback);
    expect(ipcRenderer.off).toHaveBeenCalledWith(
      expect.stringContaining('pre1-chan1-stream'),
      callback,
    );
  });
});
