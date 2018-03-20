import {Observable} from "rxjs/Rx";

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

