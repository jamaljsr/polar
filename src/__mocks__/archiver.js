// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PassThrough } = require('stream');

module.exports = () => {
  let mockStream;
  // return a fake stream when "archiver()" is called in the app
  const ctor = function() {
    mockStream = new PassThrough();
    mockStream.file = jest.fn();
    mockStream.directory = jest.fn();
    mockStream.append = jest.fn();
    mockStream.finalize = jest.fn();
    return mockStream;
  };
  // attach a func to emit events on the stream from the tests
  ctor.mockEmit = (event, data) => mockStream.emit(event, data);

  return ctor;
};
