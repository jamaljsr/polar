const path = require('path');

module.exports = [
  config => {
    // set target on webpack config to support electron
    config.target = 'electron-renderer';
    // add support for hot reload of hooks
    config.resolve.alias['react-dom'] = '@hot-loader/react-dom';
    // https://github.com/websockets/ws/issues/1538#issuecomment-577627369
    config.resolve.alias['ws'] = path.resolve(path.join(__dirname, 'node_modules/ws/index.js' ))
    return config;
  },
  [
    'use-babel-config',
    {
      presets: ['react-app'],
      plugins: [
        // babel optimizations for emotion styles
        [
          'emotion',
          {
            // sourceMap is on by default but source maps are dead code eliminated in production
            sourceMap: true,
            autoLabel: true,
            labelFormat: 'x-[local]',
            cssPropOptimization: true,
          },
        ],
        // adds support for live hot reload
        'react-hot-loader/babel',
      ],
    },
  ],
  config => {
    // helper function to troubleshoot webpack config issues
    RegExp.prototype.toJSON = RegExp.prototype.toString;
    Function.prototype.toJSON = () => 'function() { }'; // Function.prototype.toString;
    // uncomment the line below to log the webpack config to the console
    // console.log(JSON.stringify(config.module.rules, null, 2));
    // process.exit(1);
    return config;
  },
];
