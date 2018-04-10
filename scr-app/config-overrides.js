// based on: https://github.com/jdcrensh/create-react-app/blob/jdcrensh/packages/react-scripts-plugin-no-minify/utils.js
const findPlugin = (config, pluginName) =>
    config.plugins.find(p => getFunctionName(p) === pluginName);

const getFunctionName = obj => {
    const funcNameRegex = /(function (.{1,})\(|class (.{1,}))/;
    const results = funcNameRegex.exec(obj.constructor.toString());
    return results && results.length > 1 ? /\w+ (\w+)/.exec(results[1])[1] : '';
};

module.exports = (config/*, env*/) => { // todo jscodeshift breaking minification phase (fix: excluding it)
    const plugin = findPlugin(config, 'UglifyJsPlugin');
    if (plugin) {
        //chunks: [firepad, firebase, jscodeshift, babel]
        // so far jscodeshift is chunck 2, it can change with more code splits
        plugin.options.exclude = [/\/js\/2\..*chunk.js$/];
    }
    return config;
};