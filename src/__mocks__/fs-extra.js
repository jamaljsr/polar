module.exports = {
  outputFile: jest.fn(),
  writeFile: jest.fn(),
  pathExists: jest.fn(),
  readFile: jest.fn(),
  remove: jest.fn(),
  ensureDir: jest.fn(),
  copy: jest.fn(),
  mkdirp: jest.fn(),
  createWriteStream: jest.fn(),
  createReadStream: jest.fn(),
};
