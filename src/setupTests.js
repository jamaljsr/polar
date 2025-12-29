import { message, Modal, notification } from 'antd';
import { waitForElementToBeRemoved } from '@testing-library/dom';
import './i18n';
// this adds jest-dom's custom assertions
import '@testing-library/jest-dom/extend-expect';
// this is needed for antd v4 components
import 'regenerator-runtime/runtime';
// this is needed for antd v4 components
import 'jest-canvas-mock';

// Prevent displaying some un-fixable warnings in tests
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

// Prevent displaying from un-fixable errors in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Join all args to check patterns (React warnings may use format strings)
  const msg = args.map(String).join(' ');
  if (
    // antd components not unmounting properly in tests
    /Warning.*not wrapped in act\(...\)/.test(msg) ||
    // antd components not unmounting properly in tests
    /Warning: Can't perform a React state update on an unmounted component./.test(msg) ||
    // isSelected prop from @mrblenny/react-flow-chart passed to DOM
    (/Warning: React does not recognize/.test(msg) && /isSelected/.test(msg))
  ) {
    return;
  }
  return originalConsoleError(...args);
};

// suppress antd `console.time` calls in `useForm()`
console.time = () => undefined;

beforeEach(() => {
  // Fix "TypeError: window.matchMedia is not a function" in antd v4
  // https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterEach(async () => {
  // these antd components are rendered outside of the DOM tree of the component being tested,
  // so they are not automatically cleaned up by the testing-library's cleanup function. This
  // code below destroys those components before the next test is run
  message.destroy();
  notification.destroy();
  // wait for the modal to be removed before starting the next test. it uses a short animation
  const getNotification = () => document.querySelector('.ant-notification');
  if (getNotification()) {
    await waitForElementToBeRemoved(getNotification);
  }
  Modal.destroyAll();
  // wait for the modal to be removed before starting the next test. it uses a short animation
  const getModal = () => document.querySelector('.ant-modal-root');
  if (getModal()) {
    await waitForElementToBeRemoved(getModal);
  }
});
