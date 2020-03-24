const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = (config /*, env*/) => {
    // Monaco ESM start
    config.module.rules.unshift({
        test: /\/monaco-editor\/esm\/*\.ttf$/,
        use: ['file-loader']
    });
    config.module.rules.unshift({
        test: /\/monaco-editor\/esm\/*\.css$/,
        use: ['style-loader', 'css-loader']
    });
    const options = {
        languages: [ 'css', 'handlebars', 'html', 'javascript', 'json',
            'less', 'scss', 'typescript', 'xml'],
        features: ['accessibilityHelp', 'bracketMatching', 'caretOperations', 'clipboard',
            'codeAction', 'codelens', 'colorDetector', 'comment', 'contextmenu',
            'coreCommands', 'cursorUndo', 'dnd', 'find', 'folding', 'fontZoom',
            'format', 'gotoError', 'gotoLine', 'gotoSymbol', 'hover', '!iPadShowKeyboard',
            'inPlaceReplace', '!inspectTokens', 'linesOperations', 'links', 'multicursor',
            'parameterHints', 'quickCommand', 'quickOutline', 'referenceSearch', 'rename',
            'smartSelect', 'snippets', 'suggest', '!toggleHighContrast', '!toggleTabFocusMode',
            'transpose', 'wordHighlighter', 'wordOperations', 'wordPartOperations']
    };
    config.plugins.unshift(new MonacoWebpackPlugin(options));
    // Monaco ESM end

    return config;
};