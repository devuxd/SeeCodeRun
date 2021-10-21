const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = (config /*, env*/) => {
    // Monaco ESM start
    const options = {
        languages: [
            'css', 'handlebars', 'html', 'javascript', 'typescript',
            'json', 'less', 'scss', 'xml'
        ]
    };
    config.plugins.unshift(new MonacoWebpackPlugin(options));
    // Monaco ESM end
    return config;
};
