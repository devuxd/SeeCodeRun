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
        )
    ];
};

module.exports = (config, /*, env*/) => {
    includeMonacoWebpackPlugin(config);

    // add fallback for vm module
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "path": require.resolve("vm-browserify"),
        "vm": require.resolve("vm-browserify"),
        "fs": false,
    };

    return config;
};
