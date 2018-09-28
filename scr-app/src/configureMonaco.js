// const defaultMonacoConf = {
//     publicURL: process.env.PUBLIC_URL,// set in index.html's head
//     basePath: '/fireco', // path within web page's root to the fireco folder
//     isCdn: false,// load from external site, uncomment script in index.html
//     builtType: process.env.NODE_ENV === 'production' ? 'min' : 'dev',
//     monacoUrl: null,
//     monacoBuild: '0.12.0',
// };
//
// const errorCauseMessages = {
//     'UNKNOWN': 'Some files were not loaded, please check your internet connection.',
//     'MONACO_LOAD_LOCAL_SCRIPT': 'Some files were not loaded, please check your internet connection.',
// };

// const getError = (errorType, details = null) => {
//     return {
//         cause: errorType,
//         message: errorCauseMessages[errorType],
//         details: details
//     };
// };
// //from MDN
// const importScript = (sSrc, onloadFunc, onerrorFunc) => {
//     const oScript = document.createElement('script');
//     oScript.type = 'text/javascript';
//     if (onloadFunc) {
//         oScript.onload = onloadFunc;
//     }
//     if (onerrorFunc) {
//         oScript.onerror = onerrorFunc;
//     }
//     document.currentScript.parentNode.insertBefore(oScript, document.currentScript);
//     oScript.src = sSrc;
// };
//
// const loadMonaco = (onMonacoLoaded, monacoConf) => {
//     window.require.config({paths: {'vs': monacoConf.monacoUrl}});
//     window.require(['vs/editor/editor.main'], onMonacoLoaded);
// };

// const initMonacoLoader = (onMonacoLoaded, onError, monacoConf = defaultMonacoConf) => { // uses window.monacoConf defined in
// // can be loaded from CDN. Not enabled, see index.html.
//     if (monacoConf.isCdn) { // loading monaco from CDN
//         // Before loading vs/editor/editor.main, define a global MonacoEnvironment that overwrites
//         // the default worker url location (used when creating WebWorkers). The problem here is that
//         // HTML5 does not allow cross-domain web workers, so we need to proxy the instantiation of
//         // a web worker through a same-domain script
//         window.MonacoEnvironment = {
//             getWorkerUrl: function (/* workerId, label */) {
//                 if (monacoConf.builtType === 'min') {
//                     return `${monacoConf.publicURL + monacoConf.basePath}/monaco-worker-loader-proxy.js`;
//                 } else {
//                     return `${monacoConf.publicURL + monacoConf.basePath}/monaco-worker-loader-proxy.dev.js`;
//                 }
//             }
//         };
//         monacoConf.monacoUrl = `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoConf.monacoBuild}/${monacoConf.builtType}/vs`;
//         return loadMonaco(onMonacoLoaded, monacoConf);
//     } else {// loading monaco locally
//         monacoConf.monacoUrl = `${monacoConf.publicURL + monacoConf.basePath}/monaco-editor/${monacoConf.builtType}/vs`;
//         //window.require is MS/monaco's custom AMD loader
//         if (window.require) {
//             loadMonaco(onMonacoLoaded, monacoConf);
//         } else {
//             importScript(`${monacoConf.monacoUrl}/loader.js`
//                 , () => loadMonaco(onMonacoLoaded, monacoConf)
//                 , error => {
//                     onError(getError('MONACO_LOAD_LOCAL_SCRIPT', error));
//                 });
//         }
//
//     }
//
//     return true;
// };

// deprecated AMD loading
// const configureMonaco = (onMonacoConfigured, onError, monacoConf) => {
//     const onMonacoLoaded = () => {
//         configureMonacoDefaults(window.monaco);
//         onMonacoConfigured();
//     };
//     try {
//         if (window.monaco) {
//             onMonacoLoaded();
//         } else {
//             initMonacoLoader(onMonacoLoaded, onError, monacoConf);
//         }
//     } catch (e) {
//         onError(getError('UNKNOWN', e));
//     }
// };
//
// export default configureMonaco;

const configureMonacoDefaults = (monaco) => {
    const hasNativeTypescript = false;//this.hasNativeTypescript();

    const compilerDefaults = {
        jsxFactory: 'React.createElement',
        reactNamespace: 'React',
        jsx: monaco.languages.typescript.JsxEmit.React,
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: !hasNativeTypescript,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: hasNativeTypescript
            ? monaco.languages.typescript.ModuleKind.ES2015
            : monaco.languages.typescript.ModuleKind.System,
        experimentalDecorators: true,
        noEmit: true,
        allowJs: true,
        typeRoots: ['node_modules/@types'],

        forceConsistentCasingInFileNames: hasNativeTypescript,
        noImplicitReturns: hasNativeTypescript,
        noImplicitThis: hasNativeTypescript,
        noImplicitAny: hasNativeTypescript,
        strictNullChecks: hasNativeTypescript,
        suppressImplicitAnyIndexErrors: hasNativeTypescript,
        noUnusedLocals: hasNativeTypescript,
    };

    monaco.languages.typescript.typescriptDefaults.setMaximumWorkerIdleTime(-1);
    monaco.languages.typescript.javascriptDefaults.setMaximumWorkerIdleTime(-1);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        compilerDefaults
    );
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
        compilerDefaults
    );

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: !hasNativeTypescript,
        noSyntaxValidation: !hasNativeTypescript,
    });

    // monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    //   noSemanticValidation: false,
    //   noSyntaxValidation: false
    // });

// compiler options
//   monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
//     target: monaco.languages.typescript.ScriptTarget.ES2017,
//     allowNonTsExtensions: true,
//     jsx: "react"
//   });

// extra libraries
//   monaco.languages.typescript.javascriptDefaults.addExtraLib([
//     'declare class Facts {',
//     '    /**',
//     '     * Returns the next fact',
//     '     */',
//     '    static next():string',
//     '}',
//   ].join('\n'), 'filename/facts.d.ts');

};
export default configureMonacoDefaults;
