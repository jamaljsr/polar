import React from 'react';
import ReactDOM from 'react-dom';
import { info } from 'electron-log';
import { css, Global } from '@emotion/core';
import './i18n';
import { initLogger } from 'shared/utils';
import App from './components/App';

// set global configuration for logging
initLogger();
info(`Starting React App in renderer process`);

const Root: React.FC = () => (
  <>
    <Global
      styles={css`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        code {
          font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
        }

        #root {
          width: 100vw;
          height: 100vh;
        }

        .ant-form-item-with-help {
          margin-bottom: 12px;
        }
      `}
    />
    <App />
  </>
);

ReactDOM.render(<Root />, document.getElementById('root'));
