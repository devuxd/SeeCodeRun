// import generate from "@babel/generator";
// import * as t from "@babel/types";
import traverse from "@babel/traverse";
import React, {
    useEffect,
    useRef,
    createRef,
    useCallback,
    useState,
    useMemo,
} from 'react';
/** @jsxImportSource @emotion/react */
import {jsx, css} from '@emotion/react';
import Inspector from "react-inspector";
import Editor, {DiffEditor} from "@monaco-editor/react";

import {useSandboxIFrameHandler} from '../utils/reactUtils';
import ALE, {
    babelParse,
    MonacoOptions,
    RALE
} from '../core/modules/ALE';

import tests, {evaluateSnippet} from "../core/modules/snippets";
import withThemes from "../themes";
// import ErrorBoundary from '../debug/ErrorBoundary';

const isActivateTraceChanges = true;

const attachMonacoJSXHighlighter = async (
    monacoEditor, monaco
) => {
    const MonacoJSXHighlighter =
        (await import ('monaco-jsx-highlighter')).default;

    const monacoJSXHighlighter = new MonacoJSXHighlighter(
        monaco, babelParse, traverse, monacoEditor
    );
    monacoJSXHighlighter.highlightOnDidChangeModelContent(100);
    monacoJSXHighlighter.addJSXCommentCommand();
}


let tTest = {code: ""};

function tPath(path) {
    if (!tTest.code) {
        // type exploration (for reference only)
        // tTest = generate(t.argumentPlaceholder()); // ?
        // tTest = generate(t.arrayPattern([t.identifier('a'),
        // t.identifier('b')])); // [a, b]
        // tTest = generate(t.assignmentPattern(t.identifier('a'),
        // t.identifier('b'))); // a = b
        // tTest = generate(t.bigIntLiteral('7')); // 7n
        // tTest = generate(t.bindExpression()); // ::
        // tTest = generate(t.booleanLiteral(true)); // true
        // tTest = generate(t.debuggerStatement()); // debugger;
        // tTest = generate(t.decorator(t.identifier('c'))); // @c
        // tTest = generate(t.directive(t.directiveLiteral('c'))); // "c";
        // tTest = generate(
        //   t.doExpression(
        //     t.blockStatement([t.expressionStatement(t.stringLiteral("c"))])
        //   )
        // ); // do { "c"; }
        // tTest =
        // generate(
        // t.optionalCallExpression(t.identifier('c'), [], true)
        // ); // c?.()
        // tTest = generate(t.import()); // import
        //   tTest = generate(
        //     t.importDeclaration(
        //       [
        //         t.importDefaultSpecifier(t.identifier("default")),
        //         t.importNamespaceSpecifier(t.identifier("asterisk")),
        //         t.importSpecifier(
        //           t.identifier("imported"),
        //           t.identifier("imported")
        //         ),
        //         t.importSpecifier(
        //           t.identifier("local1"),
        //           t.identifier("imported1")
        //         ),
        //         t.importSpecifier(
        //           t.identifier("local2"),
        //           t.identifier("imported2")
        //         )
        //       ],
        //       t.stringLiteral("./source")
        //     )
        //   ); // import default, * as asterisk,
        //   { imported as local, imported2 as local2 } from "./source";
        // }
        // todo: replace import ...Package,
        //  * as Package, {i as l} ... from 'package/path';
        //  with
        // import * as packageN from 'package/path';
        // let Package = packageN; // * as Package
        // if(packageN.default){
        //  Package = packageN.default; // Package
        // }
        // let {i:l} = PackageN; // {i as l}
        //
        //
        // tTest = generate(t.interpreterDirective('c')); // #!c
        // JSX
        // tTest = generate(
        // t.jsxAttribute(t.jsxIdentifier('c'), t.stringLiteral('can be null'))
        // ); // c="can be null"
        // tTest = generate(
        //   t.jsxElement(
        //     t.jsxOpeningElement(
        //       t.jsxIdentifier("C"),
        //       [
        //         t.jsxAttribute(
        //           t.jsxIdentifier("c"),
        //           t.stringLiteral("can be null")
        //         )
        //       ],
        //       false
        //     ),
        //     t.jsxClosingElement(t.jsxIdentifier("C")),
        //     [t.jsxText("text")]
        //   )
        // ); //  <C c="can be null">text</C>
        // tTest =
        // generate(t.metaProperty(t.identifier('c'), t.identifier('p'))); // c.p
        // tTest = generate(
        //   t.objectMethod(
        //     "get",
        //     t.identifier("c"),
        //     [],
        //     t.blockStatement([t.expressionStatement(t.identifier("p"))])
        //   )
        // ); // get c() { p; }
        // tTest = generate(
        //   t.taggedTemplateExpression(
        //     t.identifier("c"),
        //     t.templateLiteral(
        //       [t.templateElement({ raw: "" }), t.templateElement({ raw: "" })],
        //       [t.stringLiteral("")]
        //     )
        //   )
        // ); // c`${""}`
        // tTest =
        // generate(
        // t.JSXSpreadChild(t.updateExpression('++', t.identifier('c')))
        // ); //{...c++}

        // tTest = generate(t.JSXEmptyExpression()); //

        // console.log(tTest);
    }
}


const EditorWrapper = (
    {
        theme,
        inspectorTheme,
        language,
        width = '600px',
        height = '200px',
        isTable,
        defaultValue,
        snippetKey,
        onALEReady,
        onOutputChange,
        disableOnTraceChange,
        isLive,
        onClick
    }
) => {

    const baseCss = theme === 'vs-dark' ?
        'background-color: black;color: yellow;'
        : 'background-color: white;color: darkorange;';
    const [initialCode, setInitialCode] = useState(defaultValue);
    const [masterKey, setMasterKey] = useState(0);
    const [key, setKey] = useState(0);
    const [isDiff, setIsDiff] = useState(false);
    const [areDecorationsReady, setAreDecorationsReady] = useState(false);

    const [evaluated, setEvaluated] = useState(null);

    const [evaluatedData, setEvaluatedData] = useState({
        ogResult: undefined,
        alResult: undefined,
    });

    const {ogResult, alResult} = evaluatedData;
    const {aleInstance} = evaluated || {};

    const handleChangeIsDiff = useCallback(
        () => {
            setIsDiff(isDiff => {
                !isDiff && setInitialCode(
                    initialCode => (aleInstance?.getCode() ?? initialCode)
                );
                return !isDiff;
            });
        },
        [aleInstance]);

    useEffect(() => {
            if (!evaluated || isLive) {
                return;
            }

            const {
                error, ogResult, alResult,
            } = evaluated;


            let og = ogResult;
            let al = alResult;

            if (error) {
                // console.warn(error);
                og = <span key={key} css={css`color: red;`}>{JSON.stringify(error.message)}</span>;
                al = <span key={key} css={css`color: red;`}>{JSON.stringify(al)}</span>;

            } else {
                og = <Inspector key={key} theme={inspectorTheme}
                                data={og?.error ?? og?.data}/>;
                al = <Inspector key={key} theme={inspectorTheme}
                                data={al?.error ?? al?.data}/>;
            }

            setEvaluatedData(
                // () =>
                ({
                    ogResult: og,
                    alResult: al,
                }));
        },
        [evaluated, setEvaluatedData, isLive, key]
    );

    const handleOnOutputChange = useCallback(
        () => {
            onOutputChange?.();
            // setKey(key => key + 1);
        },
        [onOutputChange]
    );

    const onMount = useCallback(
        (monacoEditor, monaco) => {
            attachMonacoJSXHighlighter(monacoEditor, monaco);

            const onError = (type, source, e) => {
                console.log(snippetKey, type, source, e);
                // throw e;
            }

            const newEvaluated = isLive ? {
                aleInstance: ALE(
                    "js",
                    null,
                    tPath,
                    global.top ?? global,
                    true,
                    onError,
                    snippetKey,
                )
            } : evaluateSnippet(
                initialCode, tPath, snippetKey, onError,
                isActivateTraceChanges
            );
            const {aleInstance} = newEvaluated;
            if (!disableOnTraceChange) {
                aleInstance?.activateTraceChanges();
            }
            // aleInstance?.setOnOutputChange(handleOnOutputChange);
            aleInstance?.attachDALE(
                monaco, monacoEditor, setAreDecorationsReady, console.log
            );
            setEvaluated(newEvaluated);
            onALEReady?.(aleInstance);
        },
        [snippetKey, initialCode, handleOnOutputChange]
    );


    useEffect(
        () => {
            setMasterKey(key => key + 1);
        },
        [snippetKey, initialCode, onOutputChange]
    );

    const editor = isDiff ?
        <DiffEditor
            height={`100%`}
            theme={theme}
            language={language}
            original={initialCode}
            modified={aleInstance?.getModel().output?.code ?? ''}
            options={{
                ...MonacoOptions.liveEditorConstructionOptions,
                renderSideBySide: false,
                readOnly: false,
            }}
        /> :
        <Editor
            height={`100%`}
            theme={theme}
            language={language}
            value={initialCode}
            options={{
                ...MonacoOptions.liveEditorConstructionOptions,
                readOnly: !isLive,
            }}
            onMount={onMount}
            key={onOutputChange ? masterKey : snippetKey}
        />
    ;

    if (isTable) {
        return (<>
            <td css={
                css`width: ${width};
                  height: ${height};
                  overflow: scroll;
                  position: relative;`
            }>
            <span
                css={css`
                  position: absolute;
                  top: 8px;
                  right: 20px;
                  z-index: 9999;`}
            >
                  <button
                      css={css`${baseCss}`}
                      onClick={onClick}
                  >
                  {snippetKey}
               </button>
                  <button
                      css={css`${baseCss}`}
                      onClick={handleChangeIsDiff}>
                   {isDiff ? 'Normal' : 'Diff'}
               </button>
               </span>
                {editor}
            </td>
            <td
                css={css`max-width: 300px;
                  white-space: nowrap;
                  overflow: scroll;
                  vertical-align: text-top;`}>
                {!!evaluated && ogResult}
            </td>
            <td
                key={key}
                title={`${key}`}
                css={css`max-width: 300px;
                  white-space: nowrap;
                  overflow: scroll;
                  vertical-align: text-top;`}>
                {!!evaluated && alResult}
            </td>
        </>)
    } else {

        return (<div
            css={
                css`width: ${width};
                  height: ${height};
                  position: absolute;`
            }>
               <span
                   onClick={handleChangeIsDiff}
                   css={css`${baseCss}
                   position: absolute;
                     top: 8px;
                     right: 8px;
                     z-index: 9999;`}>
                  {isDiff ? 'Normal' : 'Diff'}
               </span>
            {editor}
            <RALE aleInstance={aleInstance}/>
        </div>);
    }
};

const ALEDEmo = (
    {
        heightPercentage: height = 100,
        widthPercentage: width = 50,
        theme = 'vs-light', //'vs-dark'
        language = 'javascript'
    }
) => {
    const baseCss = theme === 'vs-dark' ?
        'background-color: black!important;'
        : 'background-color: white!important;';
    const inspectorTheme = theme === 'vs-dark' ? "chromeDark" : "chromeLight";
    const [originalCodes,] = useState(tests);
    const [focusOnKey, setFocusOnKey] = useState(tests.length - 1);
    const [focusOnData, setFocusOnData] = useState(null);

    const focusBoxRefs = useRef({});

    const prepareIframe = useCallback(iFrame => {
            return iFrame;
        },
        []
    );

    const [key, setKey] = useState(1);
    const handleChangeKey = useCallback(
        () => setKey(key => key + 1),
        []
    );

    const [sandboxRef, iFrameHandler] =
        useSandboxIFrameHandler(document, prepareIframe);


    const alCode = focusOnData?.getWrappedALECode?.();

    useEffect(
        () => {
            iFrameHandler.appendIframe();
            if (alCode && key) {
                iFrameHandler.appendScriptToIFrameBody(alCode);
            }

        },
        [alCode, key]
    );

    useEffect(
        () => {
            const tid = setTimeout(() => {
                focusBoxRefs.current[focusOnKey]?.current?.scrollIntoView();
            }, 1000);

            return () => clearTimeout(tid);
        },
        [focusOnKey]
    );

    const restWidth = `${100 - width}%`;
    return (<div
            css={css`width: 100%;
              height: ${height}%;
              position: relative;`}
        >
            <table css={
                css` ${baseCss}
                width: ${width}%;
                  position: absolute;
                  top: 0px;
                  left: 0px`
            }
            >
                <thead>
                <tr>
                    <th>code</th>
                    <th>og eval</th>
                    <th>al eval</th>
                </tr>
                </thead>
                <tbody>

                {originalCodes.filter((v) => v)
                    .map((code, key) => {
                        focusBoxRefs.current[key] =
                            focusBoxRefs.current[key] ?? createRef();
                        return (
                            <tr
                                key={key}
                                ref={focusBoxRefs.current[key]}
                                css={css`outline: 1px solid grey;`}>
                                <EditorWrapper
                                    theme={theme}
                                    inspectorTheme={inspectorTheme}
                                    language={language}
                                    isTable={true}
                                    snippetKey={key}
                                    // defaultValue={(!code && console.log(key, code))||"code"}
                                    onClick={() => setFocusOnKey(key)}
                                    defaultValue={code}
                                />
                            </tr>);
                    })
                }

                </tbody>
            </table>
            <div css={css`
              ${baseCss}
              width: ${restWidth};
              height: 40%;
              position: fixed;
              top: 0px;
              right: 0px`}>
                <EditorWrapper
                    key={focusOnKey}
                    theme={theme}
                    inspectorTheme={inspectorTheme}
                    language={language}
                    isTable={false}
                    snippetKey={`_${focusOnKey}`}
                    defaultValue={originalCodes[focusOnKey]}
                    isLive
                    onALEReady={setFocusOnData}
                    onOutputChange={handleChangeKey}
                    width={'100%'}
                    height={'100%'}
                />
            </div>
            <div css={css`
              ${baseCss}
              width: ${restWidth};
              border: 1px solid grey;
              height: 40%;
              position: fixed;
              top: 40%;
              right: 0px`}
                 ref={sandboxRef}
            />
            <div
                css={
                    css`
                      ${baseCss}
                      width: ${restWidth};
                      height: 20%;
                      padding-left: 4px;
                      overflow: scroll;
                      position: fixed;
                      bottom: 0px;
                      right: 0px`
                }
            >
                <h3>{tTest.code ? `CODE GENERATION TEST: ${tTest.code}` : ""}</h3>
                <h3>Results for row {focusOnKey}:</h3>
                <Inspector theme={inspectorTheme}
                           expandedPath={['$.scr.timeline']}
                           data={focusOnData}
                />
            </div>
        </div>
    );
};

export const ALEWithBabelTypesCompliance = withThemes(ALEDEmo);

export default {
    title: 'ALE DEmo',
    component: ALEWithBabelTypesCompliance,
    args: {
        heightPercentage: 100,
        widthPercentage: 50,
        theme: 'vs-light',
    },
    argTypes: {
        widthPercentage: {
            control: {
                type: 'range', min: 0, max: 100, step: 1,
            },
        },
        heightPercentage: {
            control: {
                type: 'range', min: 0, max: 100, step: 1,
            },
        },
        theme: {
            control: {
                type: 'select',
            },
            options: ['vs-light', 'vs-dark'],
        },
    },
}
