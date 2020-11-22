const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = (config /*, env*/) => {
    // Monaco ESM start
    const options = {
        languages: ['css', 'handlebars', 'html', 'javascript', 'typescript',
            'json', 'less', 'scss', 'xml'],
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