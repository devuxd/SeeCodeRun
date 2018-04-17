// based on: https://github.com/jdcrensh/create-react-app/blob/jdcrensh/packages/react-scripts-plugin-no-minify/utils.js
//npm i monaco-editor-webpack-plugin@1.1.0
// npm uninstall monaco-editor-webpack-plugin@1.1.0
//"fix-monaco-editor-webpack-plugin": "babel  ./node_modules/monaco-editor-webpack-plugin/index.ori.js --out-file ./node_modules/monaco-editor-webpack-plugin/index.js"
// const {injectBabelPlugin} = require('react-app-rewired');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
// config.plugins.unshift(new MonacoWebpackPlugin() );
// config = injectBabelPlugin(new MonacoWebpackPlugin(), config);

// Some files bark when being minified. If an error like "could not minify... file ...", the package it belongs
// has to be excluded from minimization. To do so, we need to add a exclude reg exp in UglifyJsPlugin
// for the chunk number the file'package has assigned. First, disable UglyfyJsPlugin with flag below:
const disableUglifyJsPlugin = false;
//then, after  building completes, examine the static folder, if it was a js file, look into the js folder and examine
//the chunks until you find the one that corresponds to offending file package (hint: the head comments often says
// the name and version the package, if not the footers has the magging to the original package)
// Current chunks: [firebase, jscodeshift, babel, jquery, firepad...]
// Now enable UglifyJsPlugin again: disableUglifyJsPlugin:false.
// The chunks in the array of reg exps plugin.options.exclude will be ignored.
const excludes = [
    /\/js\/1\..*chunk.js$/ // so far jscodeshift is chunk 1, it may change with more code splits
];

const filterPlugins = (config, filter) =>
    config.plugins.filter(p => filter[getFunctionName(p)] !== false);
const findPlugin = (config, pluginName) =>
    config.plugins.find(p => getFunctionName(p) === pluginName);

const getFunctionName = obj => {
    const funcNameRegex = /(function (.{1,})\(|class (.{1,}))/;
    const results = funcNameRegex.exec(obj.constructor.toString());
    return results && results.length > 1 ? /\w+ (\w+)/.exec(results[1])[1] : '';
};

module.exports = (config/*, env*/) => { // todo jscodeshift breaking minification phase (fix: excluding it)
    if (disableUglifyJsPlugin) {
        config.plugins = filterPlugins(config, {UglifyJsPlugin: false});
    } else {
        const plugin = findPlugin(config, 'UglifyJsPlugin');
        if (plugin) {
            plugin.options.exclude = excludes;
        }
    }

    return config;
};