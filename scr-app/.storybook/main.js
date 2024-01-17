const webpack = require("webpack");

module.exports = {
   staticDirs: ['../public'],
   stories: ['../src/**/*.stories.js'],
   addons: [
      '@storybook/preset-create-react-app',
      '@storybook/addon-docs',
      '@storybook/addon-actions',
      '@storybook/addon-links',
      '@storybook/addon-controls'
   ],
   core: {
      builder: "webpack5"
   },
   webpackFinal: async (config /*, {configType}*/) => {
      config.plugins.unshift(
         new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
         })
      );
      return config;
   },
};
