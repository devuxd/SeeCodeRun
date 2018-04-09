//source: https://github.com/jdcrensh/create-react-app/blob/jdcrensh/packages/react-scripts-plugin-no-minify/utils.js
const filterPlugins = (config, filter) =>
    config.plugins.filter(p => filter[getFunctionName(p)] !== false);

const getFunctionName = obj => {
    const funcNameRegex = /(function (.{1,})\(|class (.{1,}))/;
    const results = funcNameRegex.exec(obj.constructor.toString());
    return results && results.length > 1 ? /\w+ (\w+)/.exec(results[1])[1] : '';
};

module.exports = (config/*, env*/) => { // todo fix jscodeshift breaking minification phase
    config.plugins = filterPlugins(config, {
        UglifyJsPlugin: false,
    });

    return config;
};

// const findPlugin = (config, pluginName) =>
//     config.plugins.find(p => getFunctionName(p) === pluginName);
//
// const plugin = findPlugin(config, 'UglifyJsPlugin');
// if (plugin) {
//     // const i = config.plugins.indexOf(plugin);
//     //   const webpack = require('webpack');
//     plugin.exclude = /\/jscodeshift/;
//     plugin.options.paralell = true;
//     plugin.options.warnings = true;
//     // config.plugins[i] = new webpack.optimize.UglifyJsPlugin({
//     //   //  exclude: /\/jscodeshift/
//     //     // ,
//     //     uglifyOptions: plugin.options
//     // });
//     plugin.uglifyOptions= plugin.options;
//     // delete plugin.options;
//
//     // plugin.options.exclude= /\/jscodeshift/;
//     console.log("R", plugin);//, config.plugins
// }

//console.log('RULES', config.plugins);
//config.externals=
// config.module.rules[0].exclude =  /\/jscodeshift/;
//console.log('PLUGINS', config.plugins);



// //const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
// const findPlugin = (config, pluginName) =>
//     config.plugins.find(p => getFunctionName(p) ===pluginName);
// const plugin = findPlugin(config, 'UglifyJsPlugin');
// if(plugin){
//     // const i = config.plugins.indexOf(plugin);
//     // config.plugins[i] = new UglifyJsPlugin({
//     //     exclude: /\/jscodeshift/
//     // });
//     plugin.options.paralell= true;
//     plugin.options.warnings= true;
//    // plugin.options.exclude= /\/jscodeshift/;
//     console.log("R",  plugin);//, config.plugins
// }

// "start": "react-scripts start",
//     "build": "react-scripts build",
//     "test": "react-scripts test --env=jsdom",