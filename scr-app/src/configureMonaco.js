const configureMonacoDefaults = (
    monaco, hasNativeTypescript = false
) => {
    const compilerDefaults = {
        jsxFactory: 'React.createElement',
        reactNamespace: 'React',
        jsx: monaco.languages.typescript.JsxEmit.React,
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: !hasNativeTypescript,
        moduleResolution:
        monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: hasNativeTypescript
            ? monaco.languages.typescript.ModuleKind.ES2015
            : monaco.languages.typescript.ModuleKind.CommonJS,
        experimentalDecorators: true,
        noEmit: true,
        esModuleInterop: true,
        allowJs: true,
        typeRoots: ["node_modules/@types/react"],
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
};
export default configureMonacoDefaults;
