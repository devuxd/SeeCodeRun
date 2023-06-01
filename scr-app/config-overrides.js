const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = (config, /*, env*/) => {
   // Monaco ESM start
   const options = {
      languages: [
         'html', 'handlebars',
         'css', 'less', 'scss',
         'typescript', 'javascript',
         'json', 'xml',
      ]
   };
   
   config.plugins = [
      ...config.plugins,
      new MonacoWebpackPlugin()
   ];

   // add fallback for vm module
   config.resolve.fallback = {
      ...config.resolve.fallback,
      "vm": require.resolve("vm-browserify")
   };
   
   return config;
};
