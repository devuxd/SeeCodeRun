import {lazy, memo, Suspense} from 'react';

const Highlighter = lazy(() => import('react-highlight-words'));

const highlighterFallback = <div>...</div>;

const LazyHighlighter = memo((props) => (
   <Suspense fallback={highlighterFallback}>
      <Highlighter
         {...props}
      />
   </Suspense>
));
LazyHighlighter.displayName = "LazyHighlighter";

export default LazyHighlighter;
