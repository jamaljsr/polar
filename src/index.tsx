import React from 'react';
import ReactDOM from 'react-dom';
import { css, Global } from '@emotion/core';
import './i18n';
import App from './components/App';

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
      `}
    />
    <App />
  </>
);

ReactDOM.render(<Root />, document.getElementById('root'));
