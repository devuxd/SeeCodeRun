const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const includeMonacoWebpackPlugin = (config) => {
    // const {rules} = config.module;
    // const monacoWebpackPluginModuleRules = [
    //     // { // CRA does it :  const oneOfRules = rules.find(rule=>rule?.oneOf); // style-loader css rules
    //     //     test: /\.css$/,
    //     //     use: ['style-loader', 'css-loader']
    //     // },
    //     // {
    //     //     test: /\.ttf$/, // const excludeRule = newOneOfRules.pop(); {
    //     ////     exclude: [ /^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/ ],
    //     ////     type: 'asset/resource'
    //     ////   }
    //     //     type: 'asset/resource'
    //     // },
    // ];

    // config.module.rules[1].oneOf = newOneOfRules;
    //    setTimeout(() => {
    //         console.log("r", config, "rules", config.module.rules, "rules oneOf", config.module.rules[1].oneOf);
    //     }, 10000);
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        new MonacoWebpackPlugin(
            {
                languages: [
                    'html', 'handlebars',
                    'css', 'less', 'scss',
                    'typescript', 'javascript',
                    'json', 'xml',
                ],
                globalAPI: true,
            }
        ),

    ];
};

module.exports = (config, /*, env*/) => {
    includeMonacoWebpackPlugin(config);

    // add fallback for vm module
    // fixes index.html
    // name="viewport" content= user-scalable=0, minimum-scale=1
    // react-scripts 5.0.0 :: avoids Uncaught Reference errors:
    // Buffer is not defined, process is not defined (react refresh:6:1)
    // window.Buffer = function () {
    //     this.isBuffer = function () {
    //         return false
    //     };
    // };
    // window.process = {platform: null, env: null};
    // done fix.

    config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        buffer: require.resolve('buffer'),
        process: require.resolve("process/browser.js"),
        url: require.resolve('url'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        path: require.resolve("vm-browserify"),
        vm: require.resolve("vm-browserify"),
        crypto: require.resolve('crypto-browserify'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        stream: require.resolve('stream-browserify'),
    };

    // setTimeout(() => { // see config after start clears
    //     console.log("config.resolve.fallback", config.resolve.fallback);
    // }, 15000)


    return config;
};
