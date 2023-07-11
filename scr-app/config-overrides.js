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
        new MonacoWebpackPlugin(options) //
    ];

    // add fallback for vm module
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "path": require.resolve("vm-browserify"),
        "vm": require.resolve("vm-browserify"),
        "fs": false,
    };

    return config;
};
