export const configureToMonacoRange=(monaco, parser) => {
  switch (parser) {
    case 'babylon':
    default:
      return range => {
        return new monaco.Range(range.start.line
          , range.start.column+1
          , range.end ? range.end.line : range.start.line
          , range.end ? range.end.column+1 : range.start.column+1,
        );
      };
  }
};

export const configureMonacoRangeToClassname=(prefix = 'r') => {
  return (monacoRange, postfix='') => {
    return `${prefix}-${monacoRange.startLineNumber}-${monacoRange.startColumn}-${monacoRange.endLineNumber}-${monacoRange.endColumn}-${postfix}`;
  };
};

