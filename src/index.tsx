import React from 'react';
import ReactDOM from 'react-dom';
import { info } from 'electron-log';
import { css, Global } from '@emotion/react';
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

        ::-webkit-scrollbar {
          width: 8px;
          background-color: rgba(0, 0, 0, 0);
          border-radius: 10px;
        }

        ::-webkit-scrollbar:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        ::-webkit-scrollbar-thumb:vertical {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:vertical:active {
          background-color: rgba(0, 0, 0, 0.6);
          border-radius: 10px;
        }
      `}
    />
    <App />
  </>
);

ReactDOM.render(<Root />, document.getElementById('root'));
