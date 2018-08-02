// --start from:
// https://github.com/jdcrensh/create-react-app/blob/jdcrensh/packages/react-scripts-plugin-no-minify/utils.js
const getFunctionName = obj => {
    const funcNameRegex = /(function (.{1,})\(|class (.{1,}))/;
    const results = funcNameRegex.exec(obj.constructor.toString());
    return results && results.length > 1 ? /\w+ (\w+)/.exec(results[1])[1] : '';
};
const filterPlugins = (config, filter) =>
    config.plugins.filter(p => filter[getFunctionName(p)] !== false);
// --end

// Some files bark when being minified. If an error like "could not minify... file ...", the package it belongs
// has to be excluded from minimization. To do so, we need to add a exclude reg exp in UglifyJsPlugin
// for the chunk number the file'package has assigned. First, disable UglyfyJsPlugin with flag (true) below:
const disableUglifyJsPlugin = false;
//Then, after  building completes, examine the build/static folder, if it was a js file, look into the js folder
// and examine the chunks until you find the one that corresponds to offending file package
// (hint: the head comments often says the name and version the package,
// if not the footers has the mapping to the original package)
// Current chunks:
// [0:jscodeshift, 1:firebase, 2:parse5 , 3:jquery, 4:firepad, 5:jquery, 6:jquery-ui, 7:jquery-ui.resizable,
//  8:jquery-ui.draggable, 9:jquery-ui-css,10:jquery,... , 12:babel]
// Now enable UglifyJsPlugin again: disableUglifyJsPlugin:false.
// The chunks in the array of reg exps plugin.options.exclude will be ignored.
const excludes = [
    /\/js\/0\..*chunk.js$/ // so far jscodeshift is chunk 0, it may change with more code splits
];

const findPlugin = (config, pluginName) =>
    config.plugins.find(p => getFunctionName(p) === pluginName);

module.exports = (config/*, env*/) => {
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