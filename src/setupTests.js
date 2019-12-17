import { message, Modal, notification } from 'antd';
import { waitForElementToBeRemoved } from '@testing-library/dom';
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

afterEach(async () => {
  // these antd components are rendered outside of the DOM tree of the component being tested,
  // so they are not automatically cleaned up by the testing-library's cleanup function. This
  // code below destroys those components before the next test is run
  message.destroy();
  notification.destroy();
  Modal.destroyAll();
  // wait for the modal to be removed before starting the next test. it uses a short animation
  const getModal = () => document.querySelector('.ant-modal-root');
  if (getModal()) await waitForElementToBeRemoved(getModal);
});
