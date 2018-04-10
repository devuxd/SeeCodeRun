import {Observable} from "rxjs/Rx";
import _ from 'lodash';

// from is-dom
export const isNode = (val, win = window) => {
    return (!val || typeof val !== 'object')
        ? false
        : (typeof win === 'object' && typeof win.Node === 'object')
            ? (val instanceof win.Node)
            : (typeof val.nodeType === 'number') &&
            (typeof val.nodeName === 'string')
};

export const getLocationUrlData = () => {
    return {
        url:
        process.env.PUBLIC_URL ||
        `${window.location.origin}`,
        hash: `${window.location.hash}`
    };
};

export const configureLocToMonacoRange = (monaco, parser = 'babylon') => {
    switch (parser) {
        case 'babylon':
        default:
            return loc => {
                return new monaco.Range(loc.start.line
                    , loc.start.column + 1
                    , loc.end ? loc.end.line : loc.start.line
                    , loc.end ? loc.end.column + 1 : loc.start.column + 1,
                );
            };
    }
};

export const configureMonacoRangeToClassName = (prefix = 'r') => {
    return (monacoRange) => {
        return `${prefix}-${
            monacoRange.startLineNumber
            }-${
            monacoRange.startColumn
            }-${monacoRange.endLineNumber}-${monacoRange.endColumn}`;
    };
};

//https://github.com/xyc/react-inspector/blob/master/src/object-inspector/ObjectInspector.js
export const createObjectIterator = (showNonenumerable, sortObjectKeys) => {
    // return objectIterator;
    return function* (data) {
        const shouldIterate = (typeof data === 'object' && data !== null) || typeof data === 'function';
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
                    // To work around the error (happens some time when propertyName === 'caller' || propertyName === 'arguments')
                    // 'caller' and 'arguments' are restricted function properties and cannot be accessed in this context
                    // http://stackoverflow.com/questions/31921189/caller-and-arguments-are-restricted-function-properties-and-cannot-be-access
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
            if (showNonenumerable && data !== Object.prototype /* already added */) {
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

//https://github.com/xyc/react-inspector/blob/master/src/dom-inspector/DOMNodePreview.js
const newDOMElement = (element) => {
    const {tagName, attributes, style, dataset, children} = element;
    const domData = new ElementNode();
    domData.tagName = tagName;
    domData.name = domData.tagName.toLowerCase();
    domData.listeners = {};
    for (const k in element) {
        if (k.startsWith('on') && element[k]) {
            domData[k] = element[k];
        }
    }
    if (children) {
        const elChildren = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            elChildren.push(`${child.tagName}.${child.className}`);
        }
        domData.children = elChildren;
    }
    if (attributes) {
        let attributeNodes = {};
        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[i];
            attributeNodes[attribute.name] = attribute.value;
        }
        domData.attributes = attributeNodes;
    }
    if (style) {
        let styleProps = {};
        for (const prop in style) {
            (_.isNumber(style[prop]) || style[prop]) && (styleProps[prop] = style[prop]);
        }
        domData.style = styleProps;
    }

    if (dataset) {
        let dataSetValues = {};
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
    10: 'DOCUMENT_TYPE_NODE', // http://stackoverflow.com/questions/6088972/get-doctype-of-an-html-as-string-with-javascript
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

export const copifyDOMNode = (data) => {
    switch (data.nodeType) {
        case Node.ELEMENT_NODE:
            return newDOMElement(data);

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
    ) =>
        (({
              searchWords,
              textToHighlight,
              sanitize = identity,
          }) => {
            textToHighlight = sanitize(textToHighlight);
            return searchWords
                .filter(searchWord => searchWord) // Remove empty words
                .reduce((chunks, searchWord) => {
                    searchWord = sanitize(searchWord)

                    if (autoEscape) {
                        searchWord = escapeRegExpFn(searchWord)
                    }
                    const finalSearchWord = isExactWord ? `(^${searchWord}$)|([\\W|\\s]${searchWord}$)|(^${searchWord}[\\W|\\s])|([\\W|\\s]${searchWord}[\\W|\\s])` : searchWord;

                    const regex = new RegExp(finalSearchWord, caseSensitive ? 'g' : 'gi')

                    let match;
                    while ((match = regex.exec(textToHighlight))) {
                        let start = match.index
                        let end = regex.lastIndex
                        // We do not return zero-length matches
                        if (end > start) {
                            chunks.push({start, end})
                        }

                        // Prevent browsers like Firefox from getting stuck in an infinite loop
                        // See http://www.regexguru.com/2008/04/watch-out-for-zero-length-matches/
                        // eslint-disable-next-line eqeqeq
                        if (match.index == regex.lastIndex) {
                            regex.lastIndex++
                        }
                    }
                    // console.log(finalSearchWord, caseSensitive, searchWords, textToHighlight, chunks);
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
    Observable.of(window.navigator.onLine);
const goesOffline$ =
    Observable.fromEvent(window, 'offline').mapTo(false);
const goesOnline$ =
    Observable.fromEvent(window, 'online').mapTo(true);

export const online$ = () =>
    Observable.merge(
        isOnline$,
        goesOffline$,
        goesOnline$
    );
export const end$ = () => Observable.of(true);

