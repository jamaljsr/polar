// const darkTheme = require('./src/theme');

const getLessLoader = (test, withModules) => {
  return {
    test,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: !withModules
          ? undefined
          : {
              sourceMap: true,
              modules: true,
              localIdentName: '[local]___[hash:base64:5]',
            },
      },
      {
        loader: 'less-loader',
        options: {
          javascriptEnabled: true,
          modifyVars: {
            '@primary-color': '#fa8c16',
            '@component-background': '#e8e8e8',
          },
          // modifyVars: darkTheme,
        },
      },
    ],
  };
};

module.exports = [
  config => {
    // set target on webpack config to support electrong
    config.target = 'electron-renderer';
    // add support for hot reload of hooks
    config.resolve.alias['react-dom'] = '@hot-loader/react-dom';
    return config;
  },
  [
    'use-babel-config',
    {
      presets: ['react-app'],
      plugins: [
        // add babel-plugin-import for antd
        [
          'import',
          {
            libraryName: 'antd',
            libraryDirectory: 'es',
            style: true,
          },
        ],
        // adds support for live hot reload
        'react-hot-loader/babel',
      ],
    },
  ],
  // add less-loader for antd
  config => {
    const rule = config.module.rules.find(rule => rule.oneOf);

    rule.oneOf.unshift(getLessLoader(/\.less$/, false));
    rule.oneOf.unshift(getLessLoader(/\.module\.less$/, true));

    return config;
  },
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
