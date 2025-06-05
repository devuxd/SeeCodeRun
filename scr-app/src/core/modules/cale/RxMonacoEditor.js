// import {BehaviorSubject} from 'rxjs';

function findCommentPatterns(codeLines) {
    const commentLines = [];
    const commentBlocks = [];
    let inBlockComment = false;

    codeLines.forEach((line, index) => {
        const blockStartIndex = line.indexOf('/*');
        const blockEndIndex = line.indexOf('*/');
        const lineCommentIndex = line.indexOf('//');

        // Check for the start of a block comment
        if (blockStartIndex !== -1 && !inBlockComment) {
            inBlockComment = true;
            commentBlocks.push({start: {line: index, column: blockStartIndex}});
        }

        // Detect single-line comments (if not inside a block comment)
        if (lineCommentIndex !== -1 && !inBlockComment) {
            commentLines.push({line: index, column: lineCommentIndex});
        }

        // Check for the end of a block comment
        if (blockEndIndex !== -1 && inBlockComment) {
            inBlockComment = false;
            commentBlocks[commentBlocks.length - 1].end = {line: index, column: blockEndIndex};
        }
    });

    // Handle case where block comment end is missing
    if (inBlockComment) {
        commentBlocks[commentBlocks.length - 1].end = {line: codeLines.length - 1, column: Number.MAX_SAFE_INTEGER};
    }

    return {commentLines, commentBlocks};
}

function toMonacoRanges(detectCommentsOutput, monaco, editor) {
    const ranges = [];

    // Convert line comments to ranges
    detectCommentsOutput.commentLines.forEach(comment => {
        ranges.push({
            startLineNumber: comment.line + 1,
            startColumn: comment.column + 1,
            endLineNumber: comment.line + 1,
            endColumn: Number.MAX_SAFE_INTEGER
            // comment.column + 3 // Assuming '//' is the comment
        });
    });

    // Convert block comments to ranges
    detectCommentsOutput.commentBlocks.forEach(block => {
        ranges.push({
            startLineNumber: block.start.line + 1,
            startColumn: block.start.column + 1,
            endLineNumber: block.end.line + 1,
            endColumn: Number.MAX_SAFE_INTEGER === block.end.column ? Number.MAX_SAFE_INTEGER : block.end.column + 3 // Assuming '*/' ends the comment
        });
    });
    const editorModel = editor.getModel();
    const editorFullRange = editorModel.getFullModelRange();
    return ranges.map(
        range => ({
            ...range,
            endColumn: Math.min(range.endColumn, editorModel.getLineMaxColumn(range.endLineNumber))
        })
    ).map(
        (range) => (new monaco.Range(
            range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn
        ))
    ).filter(range => editorFullRange.containsRange(range));
}

const toHints = (cs, monaco) => cs.map(({range, options, expressionType, hintManager}) => {
    const kindLabel = options?.kind ?? "Parameter";
    const kind = monaco.languages.InlayHintKind[kindLabel];
    let whitespaceAfter = false;
    let whitespaceBefore = false;
    let label = "#";
    let position;

    if (kindLabel === "Parameter") {
        position = {column: range.startColumn, lineNumber: range.startLineNumber};
    } else {
        position = {column: range.endColumn, lineNumber: range.endLineNumber};
        label = `:${expressionType}`;
    }

    return {
        kind,
        position,
        label: hintManager?.getMonacoHints() ?? label,
        whitespaceAfter,
        whitespaceBefore
    }
});

const inlayHinter = (hints, monaco) => monaco.languages.registerInlayHintsProvider("javascript", { //enabled?fontFamily?fontSize?padding?
    provideInlayHints() {
        return {
            hints,
            dispose: () => {
            },
        };
    },
});

const makeGetLineDecorations = (editor, filter) => () => {
    const model = editor.getModel();
    const result = [];
    for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber++) {
        const lineDecorations = model.getLineDecorations(lineNumber, undefined, true).filter(filter); //
        if (lineDecorations.length) {
            result.push({lineNumber, lineDecorations});
        }
    }
    return result;
}

const makeLineContentChanges_ = (
    editor
) => {
    let _linesContentChanges = {
        current: null,
        previous: null,
        previousComments: null,
        currentComments: null,
    };

    const linesContent_ = () => {
        _linesContentChanges.previous = _linesContentChanges.current;
        _linesContentChanges.current = editor?.getModel()?.getLinesContent();
        _linesContentChanges.previous = _linesContentChanges.previous ?? _linesContentChanges.current;
        _linesContentChanges.previousComments = findCommentPatterns(_linesContentChanges.previous);
        _linesContentChanges.currentComments = findCommentPatterns(_linesContentChanges.current);
        return {..._linesContentChanges};
    };

    const alphaChanges = {
        ranges: () => null,
        versioning: () => false,
        prevChanges: () => null,
        nextChanges: () => null
    };
    let _changes = [alphaChanges];

    const contentChanges_ = (contentChange) => {
        if (contentChange) {
            const _versioning = contentChange.isRedoing || contentChange.isUndoing;
            let _prevChanges = _changes[0];

            if (_prevChanges === alphaChanges) {
                _prevChanges = {...alphaChanges, prevChanges: () => alphaChanges};
                _changes.unshift(_prevChanges);
                // _prevChanges = _changes[0];
            }

            const _nextChanges = {
                contentChange: () => contentChange,
                versioning: () => _versioning,
                prevChanges: () => _prevChanges,
                nextChanges: () => null,
            };

            _prevChanges.nextChanges = () => _nextChanges;
            _changes.unshift(_nextChanges);
        }

        return _changes[0];
    }
    return {
        linesContent_,
        contentChanges_,
    };
};

const toModelDeltaDecoration = (monacoEditorRanges, decorationOptions) => {
    return monacoEditorRanges.map(range => ({range, options: decorationOptions}));
}


export const makeMonacoLanguageInlayHinter = (monaco, monacoInlayHintsSubject) => {
    let inlayHinterDisposable = {dispose: () => null};

    return monacoInlayHintsSubject().subscribe(({commentRanges, callExpressionRanges}) => {
        inlayHinterDisposable?.dispose();
        if (!commentRanges) {
            return;
        }

        const monacoInlayHints = [...commentRanges, ...callExpressionRanges];
        const inLayHints = toHints(monacoInlayHints, monaco);
        inlayHinterDisposable = inlayHinter(inLayHints, monaco);
    });


    // {
    //     inLayHints: () => inLayHints,
    //         inlayHinterDisposable: () => inlayHinterDisposable,
    //     getLineDecorations
    // }
};

const makeOnDidChangeModelContentHandler = (
    editorId,
    monaco,
    editor,
    codeChangesSubject,
    monacoInlayHintsSubject,
    // decorationFilter,
    // decorationOptions
) => {
    // const getLineDecorations = makeGetLineDecorations(editor, decorationFilter);
    const {linesContent_, contentChanges_} = makeLineContentChanges_(editor);

    return codeChangesSubject().subscribe(({codeChanges, others}) => {
        if (!editor?.getModel()) {
            editor = null;
            return codeChangesSubject()?.complete();
        }
        let linesContent = linesContent_();
        const previousRanges = toMonacoRanges(linesContent.previousComments, monaco, editor);
        const currentRanges = toMonacoRanges(linesContent.currentComments, monaco, editor);
        const isCommentsCountEqual = currentRanges.length === previousRanges.length;

        if (codeChanges) {
            let contentChange = contentChanges_(codeChanges);
            const found = contentChange.contentChange().changes?.find(change => (!!previousRanges.find(range => range.containsRange(change.range))));
            if (found && isCommentsCountEqual) {
                return;
            }
        }

        monacoInlayHintsSubject().next({
            commentRanges: toModelDeltaDecoration(currentRanges),
            callExpressionRanges: []
        });
    });

}
export default makeOnDidChangeModelContentHandler;
