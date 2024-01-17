import {createContext, useContext,} from 'react';

interface SearchStateShape {
    // isGraphicalLocatorActive
    placeholder: string,
    disableMultiWord: false,
    isFunctions: true,
    isExpressions: false,
    isValues: true,
    isCase: false,
    isWord: false,
    isRegExp: false,
    visualQuery: any[],
    visualKey: null,
    value: string,
    searchWords: any[],
    setSearchState: Function,
    handleChangeValue: Function,
    handleFilterClick: Function,
    matchesFilterTrace: Function,
    matchesFilterConsole: Function,
    searchValueHighlighter: Function,
    searchStateTextHighlighter: Function,
    checkSearchActive: Function,
    getExpandedPaths: Function,
    findChunks: Function,
    functionLikeExpressions: Function,
    handleChangePartialSearchValue: Function,
}

interface SearchDispatchShape {
    setSearchState: Function,
    handleChangeValue: Function,
    handleFilterClick: Function,
    matchesFilterTrace: Function,
    matchesFilterConsole: Function,
    searchValueHighlighter: Function,
    searchStateTextHighlighter: Function,
    checkSearchActive: Function,
    getExpandedPaths: Function,
    findChunks: Function,
    functionLikeExpressions: Function,
    handleChangePartialSearchValue: Function,
}

interface ArtifactShape {
    searchState: SearchStateShape;
    searchDispatch?: SearchDispatchShape; // pending: low cohesion between value and dispatch
}

export const ArtifactContext = createContext<ArtifactShape>({searchState: null, searchDispatch: null});

export const useArtifactContext = () => useContext(ArtifactContext);

// export const ArtifactProvider = ({children}) => (
//
//     <ArtifactContext.Consumer value={{}}>
//         {children}
//     </ArtifactContext.Consumer>
// );

// export const withArtifactContext = (ReactComponent: Component ) => (props: JSX.IntrinsicAttributes) => (
//     <ArtifactContext.Consumer>
//         {(context: JSX.IntrinsicAttributes ) => {
//             return (<ReactComponent {...context} {...props} />);
//         }}
//     </ArtifactContext.Consumer>
// );

export default ArtifactContext;
