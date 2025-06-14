import {fromEvent, merge, of} from 'rxjs';
import {mapTo} from 'rxjs/operators';
import isNumber from 'lodash/isNumber';
import isArrayLike from 'lodash/isArrayLike';
import isObjectLike from 'lodash/isObjectLike';
import isFunction from 'lodash/isFunction';
import isSymbol from 'lodash/isSymbol';

import isString from 'lodash/isString';
import matchSorterMatch from 'autosuggest-highlight/match';
import Fuse from 'fuse.js';
import AppleKeyboardOptionIcon from 'mdi-material-ui/AppleKeyboardOption';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import LooksIcon from '@mui/icons-material/Looks';
import ChevronDoubleLeftIcon from 'mdi-material-ui/ChevronDoubleLeft';
import ChevronDoubleRightIcon from 'mdi-material-ui/ChevronDoubleRight';
import JsonIcon from 'mdi-material-ui/CodeJson';
import CubeOutlineIcon from 'mdi-material-ui/CubeOutline';
import DebugStepOutIcon from 'mdi-material-ui/DebugStepOut';
import CodeEqualIcon from 'mdi-material-ui/CodeEqual';
import isNative from "lodash/isNative";
import {SupportedApis} from "../core/modules/idiomata/Idiomata";

export const pushUniqueEntry = (entry, anArray) => {

    if (!entry) {
        return -1;
    }

    const i = anArray.indexOf(entry);

    if (i > -1) {
        return i;
    }

    return anArray.push(entry) - 1;
};

const regex = /function\s*([^\s]+)\s*\{\s*\[\s*native\s+code\s*\]\s*\}/gm;
export const nativeFunctionStringName = (state) => {
    if (!isFunction(state)) {
        return null;
    }
    return regex.exec(state)?.[1]?.replace(/\(|\)/g, "");
};


const nan = [NaN];
export const isTypeNaN = (datum) => {
    return nan.includes(datum);
};

const _Object = {
    keys: (obj) => {
        const keys = [];
        // if (!isObjectLike(obj))
        //     return keys;

        for (let k in obj) {
            keys.push(k);
        }

        return keys;
    }
};

export class RestrictedStateHandler {
    restrictedStates = [];
    restrictedStateErrors = [];

    handle = (currentState, key) => {
        let isRestricted = false, nextValue = undefined;

        if (this.restrictedStateErrors[this.restrictedStates.indexOf(currentState)]?.[key]) {
            isRestricted = true;
            return [isRestricted, nextValue];
        }

        try {
            nextValue = currentState[key];
        } catch (error) {
            isRestricted = true;
            const i = this.restrictedStates.push(currentState) - 1;
            this.restrictedStateErrors[i] ??= {};
            this.restrictedStateErrors[i][key] = error;
        }

        return [isRestricted, nextValue];
    };
}

export const stateToRefArray = (state, skipStates = [], Obj = _Object, contentWindow) => {
    // console.log(">", isNode(contentWindow.document));
    const restrictedStateHandler = new RestrictedStateHandler();
    const paths = [];
    const visitedStates = [];

    const stateVisitor = (currentState, path) => {
        if (currentState === null || currentState === undefined) {
            return;
        }

        if (visitedStates.indexOf(currentState) > -1 || skipStates.indexOf(currentState) > -1) {
            return;
        }

        const objLike = contentWindow?.document === currentState || (isObjectLike(currentState) && !(isNode(currentState) || isNode(currentState, contentWindow)));
        const funcLike = isFunction(currentState);
        const symbol = isSymbol(currentState);

        if (objLike || funcLike || symbol) {
            const i = visitedStates.push(currentState) - 1;
            paths[i] = path;
        }

        if (objLike) {
            Obj.keys(currentState).forEach((key) => {
                const nextPath = [...path, key];
                const [isRestricted, nextValue] = restrictedStateHandler.handle(currentState, key);

                if (isRestricted) {
                    return;
                }
                stateVisitor(nextValue, nextPath);

            });
        }
    }

    stateVisitor(state, []);

    const _aliases = [];

    const registerStateAlias = (aliasState) => {
        return pushUniqueEntry(aliasState, _aliases);
    };

    const isRootStateAlias = (aliasState) => {
        return _aliases.indexOf(aliasState) > -1;
    };

    return {
        rootState: state,
        registerStateAlias,
        isRootStateAlias,
        stateVisitor,
        paths,
        visitedStates,
        restrictedStateHandler,
        skipStates,
    };
};


export const findStateInState = (stateToFind, stateToFindIt, skipStates = [], includeFindInKeys = false, Obj = _Object) => {
    const restrictedStateHandler = new RestrictedStateHandler();

    let found = false;
    let skipped = false;
    let foundInKeys = false;
    let foundPath = [];
    const visitedStates = [];

    const stateVisitor = (stateToFind, state, path) => {
        if (includeFindInKeys && foundInKeys) {
            return;
        }

        if (found) {
            return;
        }

        if (
            stateToFind === state ||
            (isTypeNaN(stateToFind) && isTypeNaN(state))
        ) {
            found = true;
        }

        if (
            (stateToFind instanceof Date && state instanceof Date) && (stateToFind.getTime() === state.getTime())
        ) {
            found = true;
        }

        if (
            (stateToFind instanceof RegExp && state instanceof RegExp) && (stateToFind.source === state.source)
        ) {
            found = true;
        }

        if (found) {
            foundPath = path;
            return;
        }

        if (state === null || state === undefined) {
            return;
        }

        if (visitedStates.indexOf(state)) {
            return;
        }

        if (skipStates.indexOf(state) > -1) {
            skipped = true;
            return;
        }

        visitedStates.push(state);

        if (isObjectLike(state)) {
            Obj.keys(state).find((key) => {
                if (includeFindInKeys && key == stateToFind) {
                    foundInKeys = true;
                    return true;
                }

                const nextPath = [...path, key];
                const [isRestricted, nextValue] = restrictedStateHandler.handle(state, key);

                if (isRestricted) {
                    return false;
                }

                stateVisitor(stateToFind, nextValue, nextPath);

                // if (key === "document") {
                //     console.log("visiting:", state[key].getElementById, typeof state[key] === "object" && Object.values(state[key]));
                // }

                // (path.includes("getElementById")) && console.log("visiting:", path, re);

                // stateVisitor(stateToFind, state[key], [...path, key]);
                return found;
            });
        }
    }
    stateVisitor(stateToFind, stateToFindIt, []);

    return {skipped, found, foundInKeys, foundPath, visitedStates, skipStates, restrictedStateHandler};
};


export const fuseMatch = (words, pattern, options) => (
    new Fuse(words, options)
).search(pattern);

export const configureLocalMemo = (
    currentMemo = null, prevDeps = []
) => {
    return (fn, deps) => {
        for (let i = 0; deps.length; i++) {
            if (prevDeps[i] !== deps[i]) {
                currentMemo = fn();
                break;
            }
        }
        prevDeps = deps;
        return currentMemo;
    };
};


export const diffObjectKeysHandler = (objectA, objectB) => {
    const result = {allKeys: {}, equal: {}, added: {}, removed: {}};
    const diffKeys = (e, i) => {
        result.allKeys[e] = i;

        const current = objectA[e];
        const previous = objectB[e];
        const values = {current, previous};
        if (current !== previous) {
            if (objectA.hasOwnProperty(e)) {
                result.added[e] = values;
            }
            if (objectB.hasOwnProperty(e)) {
                result.removed[e] = values;
            }
        } else {
            result.equal[e] = values;
        }
    };

    return {result, diffKeys};
};

export function* diffObjectKeysIterator(objectA, objectB) {
    const {result, diffKeys} = diffObjectKeysHandler(objectA, objectB);

    let i = 0;
    for (let key in objectA) {
        yield diffKeys(objectA[key], i++);
    }

    for (let key in objectB) {
        if (result.allKeys[key] > -1) {
            continue;
        }

        yield diffKeys(objectB[key], i++);
    }

    return result;
}


// from is-dom
export const isNode = (val, win = global) => {
    return (!win || !val || typeof val !== 'object')
        ? false
        : (typeof win === 'object' && typeof win.Node === 'object')
            ? (val instanceof win.Node)
            : (typeof val.nodeType === 'number') &&
            (typeof val.nodeName === 'string')
};

export const configureCreateMonacoRange = (monaco) => (
    startLineNumber, startColumn, endLineNumber, endColumn
) => new monaco.Range(
    startLineNumber, startColumn, endLineNumber, endColumn
);

export const configureMonacoRangeToClassName = (prefix = 'r') => {
    return (monacoRange) => {
        return `${prefix}-${
            monacoRange.startLineNumber
        }-${
            monacoRange.startColumn
        }-${monacoRange.endLineNumber}-${monacoRange.endColumn}`;
    };
};

//https://github.com/xyc/react-inspector/blob/master/src/
// object-inspector/ObjectInspector.js
export const createObjectIterator = (showNonenumerable, sortObjectKeys) => {
    // return objectIterator;
    return function* (data) {
        const shouldIterate =
            (typeof data === 'object' && data !== null) ||
            typeof data === 'function';

        if (!shouldIterate) return;

        // iterable objects (except arrays)
        if (!Array.isArray(data) && data[Symbol.iterator]) {
            let i = 0;
            for (let entry of data) {
                if (Array.isArray(entry) && entry.length === 2) {
                    const [k, v] = entry;
                    yield {
                        name: k,
                        data: v,
                    };
                } else {
                    yield {
                        name: i.toString(),
                        data: entry,
                    };
                }
                i++;
            }
        } else {
            const keys = Object.getOwnPropertyNames(data);
            if (sortObjectKeys === true) {
                keys.sort();
            } else if (typeof sortObjectKeys === 'function') {
                keys.sort(sortObjectKeys);
            }

            for (let propertyName of keys) {
                if (data.propertyIsEnumerable(propertyName)) {
                    const propertyValue = data[propertyName];
                    yield {
                        name: propertyName || `""`,
                        data: propertyValue,
                    };
                } else if (showNonenumerable) {
                    // To work around the error (happens some time when
                    // propertyName === 'caller' ||
                    // propertyName === 'arguments')
                    // 'caller' and 'arguments' are restricted function
                    // properties and cannot be accessed in this context
                    // http://stackoverflow.com/questions/31921189/
                    // caller-and-arguments-are-restricted-
                    // function-properties-and-cannot-be-access
                    let propertyValue;
                    try {
                        propertyValue = data[propertyName];
                    } catch (e) {
                        // console.warn(e)
                    }

                    if (propertyValue !== undefined) {
                        yield {
                            name: propertyName,
                            data: propertyValue,
                            isNonenumerable: true,
                        };
                    }
                }
            }

            // [[Prototype]] of the object: `Object.getPrototypeOf(data)`
            // the property name is shown as "__proto__"
            if (
                showNonenumerable && data !== Object.prototype
                /* already added */
            ) {
                yield {
                    name: '__proto__',
                    data: Object.getPrototypeOf(data),
                    isNonenumerable: true,
                };
            }
        }
    };
};
//same source
export const hasChildNodes = (data, dataIterator) => {
    return !dataIterator(data).next().done;
};

export const isNativeCaught = ref => {
    try {
        return isNative(ref);
    } catch (e) {
        return true;
    }
};

const htmlEvents =
    Object.keys(global)
        .filter(k => k.startsWith('on'));
//.map(k => k.substring(2));

//https://github.com/xyc/react-inspector/blob/master/src/
// dom-inspector/DOMNodePreview.js
const defaultOnCopyChild = (child, i, children) => `${child.tagName}.${child.className}`;
const newDOMElement = (element, context) => {
    const {tagName, attributes, style, dataset, children} = element;
    const domData = new ElementNode();
    domData.tagName = tagName;
    // domData.name = domData.tagName.toLowerCase();
    domData.listeners = {};
    for (const k of htmlEvents) {
        const listener = element[k];
        listener && !isNativeCaught(listener) && (domData.listeners[k] = listener);
    }

    if (children) {
        const onCopyChild = context?.onCopyChild ?? defaultOnCopyChild;
        const childrenCopy = [];
        for (let i = 0; i < children.length; i++) {
            const childCopy = onCopyChild(children[i], i, children);
            childrenCopy.push(childCopy);
        }
        domData.children = childrenCopy;
    }

    if (attributes) {
        const attributeNodes = {};
        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[i];
            attributeNodes[attribute.name] = attribute.value;
        }
        domData.attributes = attributeNodes;
    }

    if (style) {
        const styleProps = {};

        for (const prop in style) {
            const styleProp = style[prop];
            // console.log("newDOMElement", {element, domData, style, nat: isNativeCaught(styleProp)});
            if (!isNativeCaught(styleProp)) {
                if (isNumber(styleProp) || styleProp?.length)
                    styleProps[prop] = styleProp;
            }
            // (isNumber(styleProp) || (styleProp && )) &&
            // (styleProps[prop] = styleProp);
        }
        domData.style = styleProps;
    }

    if (dataset) {
        const dataSetValues = {};
        Object.keys(dataset).forEach(key => {
            dataSetValues[key] = dataset[key];
        });
        domData.dataset = dataSetValues;
    }

    return domData;
};

const nameByNodeType = {
    1: 'ELEMENT_NODE',
    3: 'TEXT_NODE',
    7: 'PROCESSING_INSTRUCTION_NODE',
    8: 'COMMENT_NODE',
    9: 'DOCUMENT_NODE',
    10: 'DOCUMENT_TYPE_NODE', // http://stackoverflow.com/questions/6088972/
    // get-doctype-of-an-html-as-string-with-javascript
    11: 'DOCUMENT_FRAGMENT_NODE',
};

class DOMNode {
}

class ElementNode {
}

class TextNode {
}

class ProcessingInstructionNode {
}

class CommentNode {
}

class DocumentNode {
}

class DocumentTypeNode {
}

class DocumentFragmentNode {
}

class ReactElement {
}


const newReactElement = (element, context) => {
    const {type, key, ref, props} = element;
    const {children, ...otherProps} = props ?? {};

    const domData = new ReactElement();
    //
    // if(isString(type)){
    //
    // }
    // domData.tagName = type; // amke refs live
    domData.type = type; // amke refs live
    domData.key = key;
    domData.ref = ref; // make live
    // domData.name = domData.tagName.toLowerCase();
    // domData.listeners = {};
    // for (const k of htmlEvents) {
    //    const listener = element[k];
    //    listener && !isNativeCaught(listener) && (domData.listeners[k] = listener);
    // }
    domData.props = {};

    const attributes = Object.keys(otherProps);

    if (attributes) {
        const attributeNodes = {};
        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[i];
            attributeNodes[attribute] = otherProps[attribute];
        }
        domData.props = attributeNodes;
    }

    if (children) {
        const onCopyChild = context?.onCopyChild ?? defaultOnCopyChild;
        const childrenCopy = [];

        if (!isArrayLike(children) || isString(children)) {
            domData.props.children = children;
        } else {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isString(child)) {
                    childrenCopy.push(child);
                } else {
                    const childCopy = onCopyChild(child, i, children);
                    childrenCopy.push(childCopy);
                }
            }
            domData.props.children = childrenCopy;
        }

    }

    return domData;
};

export const copifyDOMNode = (data, replacer, apiName) => {
    if (SupportedApis.React === apiName) {
        return newReactElement(data, replacer);
    }

    switch (data.nodeType) {
        case Node.ELEMENT_NODE:
            return newDOMElement(data, replacer);

        case Node.TEXT_NODE:
            const textNode = new TextNode();
            textNode.textContent = data.textContent;
            return textNode;

        case Node.CDATA_SECTION_NODE:
            const cdTextNode = new TextNode();
            cdTextNode.textContent = '<![CDATA[' + data.textContent + ']]>';
            return cdTextNode;

        case Node.COMMENT_NODE:
            const cTextNode = new CommentNode();
            cTextNode.textContent = '<!--' + data.textContent + '-->';
            return cTextNode;

        case Node.PROCESSING_INSTRUCTION_NODE:
            const piNode = new ProcessingInstructionNode();
            piNode.nodeName = data.nodeName;
            return piNode;

        case Node.DOCUMENT_TYPE_NODE:
            const dtNode = new DocumentTypeNode();
            dtNode.name = data.name;
            dtNode.publicId = data.publicId ? ` PUBLIC "${data.publicId}"` : '';
            dtNode.systemId = data.systemId ? ` "${data.systemId}"` : '';
            (!data.publicId && data.systemId) && (dtNode.SYSTEM = ' SYSTEM');
            return dtNode;

        case Node.DOCUMENT_NODE:
            const dNode = new DocumentNode();
            dNode.nodeName = data.nodeName;
            return dNode;

        case Node.DOCUMENT_FRAGMENT_NODE:
            const dfNode = new DocumentFragmentNode();
            dfNode.nodeName = data.nodeName;
            return dfNode;

        default:
            const domNode = new DOMNode();
            domNode.nodeType = nameByNodeType[data.nodeType];
            return domNode;
    }
};

export const configureFindChunks =
    (
        autoEscape,
        caseSensitive,
        isExactWord,
        disableAdvanceMatching = true,
        useMatchSorter
    ) =>
        (({
              searchWords,
              textToHighlight,
              sanitize = identity,
              minMatchCharLengthDelta = 2
          }) => {

            textToHighlight = sanitize(textToHighlight);

            if (!textToHighlight) {
                return [];
            }

            const textToHighlightMin =
                textToHighlight.length - minMatchCharLengthDelta;

            return searchWords
                .filter(searchWord => searchWord) // Remove empty words
                .reduce((chunks, searchWord) => {
                    searchWord = sanitize(searchWord);

                    if (autoEscape) {
                        searchWord = escapeRegExpFn(searchWord)
                    }

                    if (!disableAdvanceMatching &&
                        autoEscape && !isExactWord) {

                        if (useMatchSorter) {
                            if (!caseSensitive) {
                                const matches = matchSorterMatch(
                                    textToHighlight, searchWord
                                );
                                matches.forEach(entry => chunks.push(
                                    {start: entry[0], end: entry[1]}
                                ))
                                return chunks;
                            }

                        } else {
                            const options = {
                                isCaseSensitive: caseSensitive,
                                // includeScore: false,
                                shouldSort: false,
                                includeMatches: true,
                                findAllMatches: true,
                                minMatchCharLength: Math.max(
                                    Math.min(
                                        (searchWord.length -
                                            minMatchCharLengthDelta),
                                        textToHighlightMin
                                    ),
                                    1
                                ),
                                // location: 0,
                                // threshold: 0.6,
                                // distance: 100,
                                // useExtendedSearch: false,
                                ignoreLocation: true,
                                // ignoreFieldNorm: false,
                            };
                            const fuseResults = fuseMatch(
                                [textToHighlight],
                                searchWord,
                                options
                            );
                            fuseResults.forEach(
                                item => item.matches?.forEach(
                                    match => match.indices?.forEach(
                                        entry => chunks.push(
                                            {start: entry[0], end: entry[1] + 1}
                                        )
                                    )));
                            return chunks;
                        }
                    }


                    const finalSearchWord =
                        isExactWord ?
                            `(^${searchWord}$)|([\\W|\\s]${searchWord}$)|(^${
                                searchWord
                            }[\\W|\\s])|([\\W|\\s]${searchWord}[\\W|\\s])`
                            : searchWord;

                    const regex = new RegExp(
                        finalSearchWord, caseSensitive ? 'g' : 'gi'
                    );

                    let match;
                    while ((match = regex.exec(textToHighlight))) {
                        let start = match.index
                        let end = regex.lastIndex
                        // We do not return zero-length matches
                        if (end > start) {
                            chunks.push({
                                searchWord,
                                finalSearchWord,
                                start,
                                end
                            });
                        }

                        // Prevent browsers like Firefox from
                        // getting stuck in an infinite loop
                        // See http://www.regexguru.com/
                        // 2008/04/watch-out-for-zero-length-matches/
                        // eslint-disable-next-line eqeqeq
                        if (match.index == regex.lastIndex) {
                            regex.lastIndex++
                        }
                    }
                    return chunks;
                }, []);
        });

function identity(value) {
    return value
}

function escapeRegExpFn(str) {
    // eslint-disable-next-line no-useless-escape
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}

export const functionLikeExpressions = [
    'Function',
    'FunctionDeclaration',
    'FunctionExpression',
    'CallExpression',
    'AwaitExpression',
    'ArrowFunctionExpression',
    'MethodDefinition',
];

const isOnline$ =
    of(window.navigator.onLine);
const goesOffline$ =
    fromEvent(window, 'offline')
        .pipe(mapTo(false));
const goesOnline$ =
    fromEvent(window, 'online')
        .pipe(mapTo(true));

export const online$ = () =>
    merge(
        isOnline$,
        goesOffline$,
        goesOnline$
    );
export const end$ = () => of(true);

export const UIcons = {
    FuncCall: CallMadeIcon, // callExpression
    FuncExec: CallReceivedIcon, // [Arrow|Method] Function [Expression] blocks
    Branch: AppleKeyboardOptionIcon, // Control Flow blocks
    ForwardFlow: ChevronDoubleRightIcon, // uses from here
    BackFlow: ChevronDoubleLeftIcon, // uses until here
    Ripple: LooksIcon, // references
    Data: CodeEqualIcon, // data structure deep equality
    FunctionRef: DebugStepOutIcon,
    ObjectIdiom: JsonIcon,
    CallbackIdiom: CallMergeIcon,
    GraphicalIdiom: CubeOutlineIcon,
};

export const mapUIconFromExpressionType = (expressionType) => {
    switch (expressionType) {
        case 'FunctionDeclaration':
            return UIcons.FuncExec;
        case 'ArrowFunctionExpression':
            return UIcons.FuncExec;
        default:
            return null;
    }
};

export const decodeBabelError = (
    babelError = '', offsetAfterDivider = 2
) => {
    const lines = babelError.message.split('\n');
    const errorInfo = lines.reduce((location, line, i) => {
        if (location.found) {
            return location;
        }
        const indicatorColumn = line.indexOf('>');
        if (indicatorColumn > -1) {
            const dividerColumn = line.indexOf('|');
            if (dividerColumn > -1 && indicatorColumn < dividerColumn) {
                const lineNumber = parseInt(
                    line.substring(indicatorColumn + 1, dividerColumn).trim(),
                    10
                );
                if (!isNaN(lineNumber)) {
                    location.lineNumber = lineNumber;
                    const nextLineDividerColumn = lines[i + 1].indexOf('|');
                    const rawColumn = lines[i + 1].indexOf('^');
                    if (nextLineDividerColumn < rawColumn) {
                        location.column = (
                            rawColumn
                            - nextLineDividerColumn
                            - offsetAfterDivider
                        ); //-#-|--code
                        location.found = true;
                    }
                }
            }
        }
        return location;
    }, {found: false});
    errorInfo.message = lines[0];
    return errorInfo;
};

export function toRawObject(classObject) {
    return Object.keys(classObject).reduce((r, e) => {
        r[e] = classObject[e];
        return r;
    }, {});
}

/* // old firebase sync before Firepad supported Monaco.
// After any change, it submits the whole file to the server instead of the edits
const customFirepadHeadlessMonacoSync = (
fireco, firecoPad, editorId, editorText
) => {
    firecoPad.headlessFirepad =
    new fireco.Firepad.Headless(firecoPad.firebaseRef);
    firecoPad.preventStarvation = debounce(() => {
        firecoPad.mutex = false;
    }, 5000);

    firecoPad.getFirecoText =
    () => firecoPad.headlessFirepad.getText((text) => {
        firecoPad.isInit = true;
        this.setEditorText(editorId, text);
    });
    firecoPad.getFirecoTextDebounced = debounce(
    firecoPad.getFirecoText, 50, {maxWait: 100}
    );

    firecoPad.setFirecoText = (text, isChain) => {
        // Prevents Firepad mutex starvation when Firebase is not connected.
        firecoPad.preventStarvation();

        if (firecoPad.mutex && !isChain) {
            // chains all pending editor changes
            firecoPad
                .nextSetFirecoTexts
                .unshift(
                    () => firecoPad.setFirecoText(null, true)
                );
            return;
        }

        firecoPad.mutex = true;
        firecoPad
        .headlessFirepad
        .setText(
        text || firecoPad.monacoEditor.getValue()
        , (
        //error, committed
        ) => {
            if (firecoPad.nextSetFirecoTexts.length) {
                // only send the most recent change, discard the rest
                firecoPad.nextSetFirecoTexts[0]();
                firecoPad.nextSetFirecoTexts = [];
            } else {
                firecoPad.preventStarvation.cancel();
                firecoPad.mutex = false;
            }
        }
        );
    };

    if (firecoPad.isNew && isString(editorText)) {
        firecoPad.setFirecoText(editorText);
        firecoPad.monacoEditor.setValue(editorText);
    } else {
        firecoPad.getFirecoText();
    }

    firecoPad.firebaseRef
        .child('history')
        .limitToLast(1)
        .on('child_added', snapshot => {
            if (snapshot.exists()
            && firecoPad.headlessFirepad.firebaseAdapter_.userId_
              !== snapshot.val().a
            ) {
                firecoPad.getFirecoTextDebounced();
            } else {
                firecoPad.getFirecoTextDebounced.cancel();
            }
        });

    firecoPad.onContentChanged = () => {
        firecoPad.setFirecoText();
    };
};
*/
