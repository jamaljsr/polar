// __mocks__/fileService.js

module.exports = {
  fileService: {
    existsSync: jest.fn(() => false),
    readFileSync: jest.fn(() => '{}'),
    copyFileSync: jest.fn(),
  },
};