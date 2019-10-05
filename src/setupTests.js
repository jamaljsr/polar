import './i18n';
// this adds jest-dom's custom assertions
import '@testing-library/jest-dom/extend-expect';

// Prevent displaying some unfixable warnings in tests
const originalConsoleWarning = console.warn;
console.warn = (...args) => {
  if (
    // renamed componentWillReceiveProps in dependencies
    /Warning.*componentWillReceiveProps has been renamed/.test(args[0]) ||
    // renamed componentWillReceiveProps in dependencies
    /Warning.*componentWillMount has been renamed/.test(args[0]) ||
    // router history inconsistencies
    /Warning: Hash history cannot PUSH the same path/.test(args[0]) ||
    // antd form validation warnings
    /async-validator:/.test(args[0])
  ) {
    return;
  }
  originalConsoleWarning(...args);
};
