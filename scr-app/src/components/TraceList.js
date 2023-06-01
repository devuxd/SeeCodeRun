import React, {
    memo,
    forwardRef,
    useRef,
    useCallback,
    useEffect,
    useMemo,
    useState,
    useContext
} from 'react';
/** @jsxImportSource @emotion/react */
import {jsx} from '@emotion/react';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import {alpha, darken, lighten} from '@mui/material/styles';

import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import {useObjectIterator} from 'react-inspector';
import InfiniteStickyList from './InfiniteStickyList';
import PastebinContext from '../contexts/PastebinContext';
import {TABLE_ROW_HEIGHT} from '../containers/Pastebin';
import {
    configureGoToTimelineBranch,
} from '../containers/LiveExpressionStore';
import OverflowComponent from './OverflowComponent';
import {ThemeContext, ThemesRef} from '../themes';
// import {useMeasureBeforeMount, usePrevious} from '../utils/reactUtils';
import {StickyAction, defaultFloatyMoreIcon} from './StickyAction';
import ALEInspector from '../core/modules/RALE/ALEInspector';
import {requestAnimationFrameWhenIdle} from "../utils/renderingUtils";
import ALEContext from "../core/modules/RALE/ALEContext";

const toOneLineText = (text = '') => (
    text
        .replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g, ' ')
        .replace(/[\t\s\u202F\u00A0]+/g, ' ')
);

const CodeFragment = memo((
    {
        text,
        monaco = global.monaco,
        dataLang = "javascript",
        disableOneLineText = false,
        cacheId,
        itemsCache,
    }
) => {
    const {monacoTheme} = useContext(ThemeContext);
    const ref = useRef();
    const cache = useMemo(
        () => {
            let cache = {};
            if (itemsCache && cacheId) {
                cache = itemsCache.current[cacheId] ??= {};
            }
            return cache;
        },
        [itemsCache, cacheId]
    );

    const oneLineText = useMemo(
        () => {
            if (!text && cache._oneLineText) {
                return cache._oneLineText;
            }

            if (
                !(cache._text === text &&
                    cache._disableOneLineText === disableOneLineText)
            ) {
                cache._text = text;
                cache._disableOneLineText = disableOneLineText;
                cache._oneLineText = disableOneLineText ? text : toOneLineText(text);
            }

            return cache._oneLineText;
        },
        [cache, text, disableOneLineText]
    );

    const [loading, setLoading] = useState(true);

    useEffect(
        () => {
            if (
                !monaco ||
                (cache._payload && cache._payload === ref.current?.innerHTML)
            ) {
                setLoading(false);
                return null;
            }

            const dispose = requestAnimationFrameWhenIdle(
                () => {
                    const {_sourceText, _payload, _oneLineText} = cache;

                    if (_payload && _sourceText === _oneLineText) {
                        return _payload;
                    }

                    return monaco.editor.colorize(
                        _oneLineText, dataLang, {theme: monacoTheme}
                    );
                },
                (t, coloredText, e) => {
                    if (e) {
                        console.warn(e);
                        return;
                    }

                    if (coloredText) {
                        cache._sourceText = cache._oneLineText;
                        cache._payload = coloredText;
                    }

                    setLoading(false);
                }
            );

            return () => {
                dispose();
            };
        },
        [dataLang, monaco, monacoTheme, cache]);

    useEffect(() => {
            if (!ref.current || !cache._payload || loading) {
                return;
            }

            if (ref.current.innerHTML === cache._payload) {
                return;
            }

            ref.current.innerHTML = cache._payload;

        },
        [loading, cache]
    );

    return (
        loading ?
            <Skeleton variant="text" sx={{fontSize: '1rem'}} animation={"wave"} width={1000}/>
            : <div key={monacoTheme} ref={ref} data-lang={dataLang}>{oneLineText}</div>
    );

});

CodeFragment.displayName = "CodeFragment";

// const aleInspectorSkeleton = <div>...</div>;
// <Skeleton variant="text" animation={false} height={22}/>;
// const inspectorMockStyle = {
//    fontSize: 11,
//    fontFamily: "Menlo, monospace",
//    opacity: .7,
// };
// const ALEInspectorFragment =memo(
//    (
//    props
// ) => {
// const {aleObject, data: _data, cacheId, itemsCache} = props
//
// const cache = useMemo(
//    () => {
//       if (itemsCache && cacheId) {
//          return itemsCache[cacheId] ??= {};
//       } else {
//          return {};
//       }
//    },
//    [
//       itemsCache, cacheId
//    ]
// );
//
//
// const data = aleObject?.getSnapshot() ?? _data;
// const typeOfData = typeof data;
// const isComplex = (typeOfData === "object" || typeOfData === "function");
//
// const [mounted, setMounted] = useState(false);
//
// const inspectorRef = useRef();
//
// useEffect(
//    () => {
//       if (mounted && !cache.inspector) {
//          // console.log("1");
//          inspectorRef.current = <ALEInspector {...props}/>;
//          cache.inspector = inspectorRef.current;
//          return () => null;
//       }
//
//       let done = false;
//       const dispose = requestAnimationFrameWhenIdle(
//          null,
//          (t, inspector) => {
//             inspectorRef.current = <ALEInspector {...props}/>;
//             cache.inspector = inspectorRef.current;
//             // console.log("0");
//             setMounted(true);
//             done = true;
//          }
//       );
//
//       return () => {
//          if (done) {
//             return;
//          }
//          dispose();
//       };
//    },
//    [cache, mounted, props]
// );
//
// console.log(props);
// return (
//    mounted ?
//       inspectorRef.current
//       : (cache.inspector ??
//          (<span style={inspectorMockStyle}>
//                {isComplex ? `[${typeOfData}]` : `${data}`}
//          </span>
//          )
//       )
// );
// }
// );

const ALEInspectorFragment = memo(ALEInspector);
ALEInspectorFragment.displayName = "ALEInspectorFragment";

const expressionCellMaxWidth = 600;
const expressionCellMinWidth = 100;
const valueCellMinWidth = 200;
const valueCellMaxWidth = 'unset';

const styles = theme => {
    const {highlighting: HighlightPalette} = ThemesRef.current;
    return ({
        row: {},
        sticky: {
            backgroundColor: theme.palette.background.default,
            position: 'sticky !important',
            zIndex: 2,
        },
        root: {
            width: '100%',
            height: '100%',
        },
        tableCell: {
            padding: theme.spacing(0.5),
        },
        valueCell: {
            padding: `${theme.spacing(0.5)} 0px`,//theme.spacing(0.5),
            borderBottom: 0,
            maxWidth: valueCellMaxWidth,
            minWidth: valueCellMinWidth,
            minHeight: TABLE_ROW_HEIGHT,
        },
        table: {
            minWidth: 'calc(100%)',
        },
        tableWrapper: {
            overflowX: 'auto',
        },
        tableRow: {
            '&$hover:hover': {
                backgroundColor: HighlightPalette.text,
            },
            cursor: 'pointer',
        },
        tableRowError: {
            backgroundColor: alpha(HighlightPalette.error, 0.25),
            '&$hover:hover': {
                backgroundColor: HighlightPalette.error,
            },
        },
        tableRowGraphical: {
            backgroundColor: alpha(HighlightPalette.graphical, 0.25),
            '&$hover:hover': {
                backgroundColor: HighlightPalette.graphical,
            }
        },
        tableRowInput: {
            // height: TABLE_ROW_HEIGHT,
        },
        hover: {},
        bottomAction: {
            margin: theme.spacing(4),
        },
        cellParamContainer: {
            display: 'flex',
            alignItems: 'center',
            flexFlow: 'row',
        },
        cellParam: {
            marginLeft: theme.spacing(1),
        },
        icon: {
            fontSize: theme.spacing(2),
            color: theme.palette.mode === 'light'
                ? lighten(alpha(theme.palette.divider, 1), 0.6)
                : darken(alpha(theme.palette.divider, 1), 0.4)
        },
        bottomValueCell: {
            borderTop: `1px solid ${
                theme.palette.mode === 'light'
                    ? lighten(alpha(theme.palette.divider, 1), 0.88)
                    : darken(alpha(theme.palette.divider, 1), 0.8)
            }`,
        },
        commandText: {
            fontFamily: 'Menlo, monospace',
            fontSize: 12,
        },
        tableHeadRow: {
            height: TABLE_ROW_HEIGHT + 16,
        },
        flexContainer: {
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
        },
        tableRowHover: {
            '&:hover': {
                backgroundColor: theme.palette.grey[200],
            },
        },
        noClick: {
            cursor: 'initial',
        },
        rowContainer: {
            display: 'flex',
            alignItems: 'center',
            flexFlow: 'row',
        },
        hoverObject: {
            backgroundColor: alpha(HighlightPalette.object, 0.05),
            '&$hover:hover': {
                backgroundColor: HighlightPalette.object,
            },
        },
        hoverGraphical: {
            backgroundColor: HighlightPalette.graphical,
            '&$hover:hover': {
                backgroundColor: alpha(HighlightPalette.graphical, 0.2),
            }
        },
        hoverError: {
            backgroundColor: alpha(HighlightPalette.error, 0.2),
            '&$hover:hover': {
                backgroundColor: HighlightPalette.error,
            },
        },
        expressionCellRoot: {
            borderBottom: 0,
            overflow: 'hidden',
            display: 'table-cell',
            verticalAlign: 'inherit',
            textAlign: 'left',
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
            maxWidth: expressionCellMaxWidth,
            minWidth: expressionCellMinWidth,
            minHeight: TABLE_ROW_HEIGHT,
        },
        valueCellFill: {
            flex: 'auto',
            width: '100%',
            overflow: 'hidden',
            margin: 0,
            padding: theme.spacing(1),
            borderBottom: 0,
        },
        expressionCellContent: {
            overflow: 'auto',
            maxWidth: expressionCellMaxWidth,
            minWidth: expressionCellMinWidth,
            '&::-webkit-scrollbar': {
                display: 'none', /* Hide scrollbar for IE, Edge and Firefox */
                '-webkit-appearance': 'none',
                width: 0,
                height: 0,
            },
            msOverflowStyle: 'none',  /* IE and Edge */
            scrollbarWidth: 'none',  /* Firefox */
        },
        tableHeadCell: {
            marginLeft: theme.spacing(35),
        },
        cellPadding: {
            paddingLeft: theme.spacing(6),
        },
        highlight: {
            backgroundColor: lighten(alpha(theme.palette.secondary.main, 1), 0.8),
        }
    })
};

function createData(id, entry) {
    return {id, entry};
}

const RowContainer = memo(forwardRef(
    (
        {
            isSticky, classes, children
        },
        ref
    ) =>
        (
            <TableRow
                selected={isSticky}
                hover
                component="div"
                ref={ref}
                className={classes.rowContainer}
            >
                {children}
            </TableRow>
        )
));

RowContainer.displayName = "RowContainer";

const rowColumnStylesDefault = ([
    {
        flex: 1,
    },
    {
        flex: 3,
    },
]);

// const rowColumnStylesResizingDefault = ([
//    {
//       flex: 1,
//    },
//    {
//       flex: 3,
//       maxHeight: 26,
//       overflowY: 'hidden',
//    },
// ]);

const CodeContainer = (
    {
        cacheId,
        itemsCache,
        classes,
        expression = '',
        searchWords,
        findChunks,
        buttonClick,
        isMatch,
        searchStateTextHighlighter
    }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(
        () => {
            if (!mounted) {
                setMounted(true);
            }
            return () => null;
        },
        [mounted]
    );

    return (mounted &&
        <OverflowComponent
            disableOverflowDetectionY={true}
            contentClassName={classes.expressionCellContent}
        >
            <ButtonBase
                onClick={buttonClick}
            >
                <Typography
                    align='left'
                    noWrap
                    variant='code'
                >
                    {isMatch ?
                        searchStateTextHighlighter(expression, findChunks, searchWords)
                        : <CodeFragment
                            cacheId={cacheId}
                            itemsCache={itemsCache}
                            text={expression}
                        />
                    }
                </Typography>
            </ButtonBase>
        </OverflowComponent>);
};

CodeContainer.propTypes = {
    cacheId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    itemsCache: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    classes: PropTypes.object,
    expression: PropTypes.string,
    searchWords: PropTypes.array,
    findChunks: PropTypes.func,
    buttonClick: PropTypes.func,
    isMatch: PropTypes.bool,
    searchStateTextHighlighter: PropTypes.func,
};

const Row = ({index, data}) => {
    const goToTimelineBranch = configureGoToTimelineBranch;

    const {
        classes, objectClasses,
        columnStyles = rowColumnStylesDefault,
        items,
        itemsCache,
    } = data;
    // console.log(data);

    const {
        searchState, configureMappingEventListeners,

        // orderBy, objectNodeRenderer,
        // handleSelectClick, isRowSelected,
        // highlightSingleText, setCursorToLocation,
        // traceSubscriber, isNew, highlightErrors,
    } = useContext(PastebinContext);

    const {
        aleInstance
    } = useContext(ALEContext);

    const {zale, dale} = aleInstance ?? {};

    const {searchWords, searchStateTextHighlighter} = searchState ?? {};
    // const [hasMore, setHasMore] = useState(false);

    const isValid = !!index;

    const item = isValid && items?.[index];
    const n = item?.entry;
    const result = n?.chunksResult;
    const isSearchActive = searchState?.checkSearchActive?.();
    const isMatch = isSearchActive && n?.isMatch;
    const expressionId = n?.entry?.expressionId ?? '';
    const cacheId = `${expressionId}`;
    const traceCacheId = `trace-${index}`;

    const findChunks = useCallback(
        () => (result?.expressionChunks || []),
        [result]
    );

    const {onMouseEnter, onMouseLeave, onClick} = useMemo(
        () => configureMappingEventListeners?.(n || {}),
        [configureMappingEventListeners, n]
    );

    const buttonClick = useCallback(
        () => {
            onClick();
            n?.entry && goToTimelineBranch()(n.entry);
        },
        [onClick, goToTimelineBranch, n]
    );

    const codeText = useMemo(() => {
            if (!dale) {
                return '';
            }

            const [, sourceText, zone] = (cacheId && dale.getSyntaxFragment?.(expressionId)) || [];
            // console.log("sourceText", sourceText);
            if (!zone) {
                return '';
            }

            // const declarationZone =zale.lookupZoneParentByType(zone, 'VariableDeclaration');
            // const zoneText = zone.getAlternateText();
            // const declarationZoneText = declarationZone?.getAlternateText();
            // console.log("ALE", {zone, sourceText, declarationZone, declarationZoneText});
            // return declarationZone? declarationZone.sourceText: zone.sourceText;
            return sourceText;

        },
        [cacheId, expressionId, zale]
    );


    return (isValid && <>
            <TableCell
                component="div"
                classes={objectClasses.tableCell}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                css={columnStyles[0]}
            >
                <CodeContainer
                    cacheId={cacheId}
                    itemsCache={itemsCache}
                    classes={classes}
                    expression={codeText}
                    // expression={n?.expression}
                    buttonClick={buttonClick}
                    searchWords={searchWords}
                    findChunks={findChunks}
                    isMatch={isMatch}
                    searchStateTextHighlighter={searchStateTextHighlighter}
                />
            </TableCell>
            <TableCell
                // ref={ref}
                component="div"
                className={classes.valueCell}
                classes={
                    n?.isError ? objectClasses.hoverError
                        : n?.isGraphical ? objectClasses.hoverGraphical
                            : objectClasses.hoverObject
                }
                // onMouseEnter={onHover}
                onMouseLeave={onMouseLeave}
                css={columnStyles[1]}
            >
                <ALEInspectorFragment
                    cacheId={traceCacheId}
                    itemsCache={itemsCache}
                    connectorVariant={"marker"}
                    aleObject={n?.entry?.entry?.logValue}
                />
                {/*{hasMore && defaultFloatyMoreIcon}*/}
            </TableCell>
        </>

    );

};

const EmptyRow = withStyles(styles)(({classes}) => {
    const tableClasses = useMemo(
        () => ({root: classes.valueCellFill}
        ), [classes]);
    return (
        <TableRow
            hover
            component="div"
            className={classes.rowContainer}
        >
            <TableCell
                component="div"
                classes={tableClasses}
                align={'center'}
            >
                <Typography
                    noWrap
                    variant='code'
                >
                    No trace entries yet.
                </Typography>
            </TableCell>
        </TableRow>
    );
});

export const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);


const WindowedTable = (
    {
        options,
        onHandleTotalChange,
        onHandleConsoleTotalChange,
        heightDelta,
        autoScroll,
        classes,
        monaco = global.monaco,
    }
) => {
    // console.log(props);
    const {
        data, isNew, searchState, highlightErrors, order,
        ...rest
        //configureMappingEventListeners,
        // orderBy, objectNodeRenderer,
        // handleSelectClick, isRowSelected,
        // highlightSingleText, setCursorToLocation,
        // traceSubscriber,
    } = useContext(PastebinContext);

    // logs if data is being updated correctly
    // useEffect(() => {
    //     console.log("PastebinContext", data);
    // }, [data]);

    const autoScrollTo = order === 'asc' ? 'bottom' : 'top';

    const objectIterator = useObjectIterator();

    const itemsCache = useRef({});
    const [stickyIndices, setStickyIndices] = useState([]);
    const [consoleTotalMatches, setConsoleTotalMatches] = useState(0);
    const totalMatches = data.length - consoleTotalMatches;
    const [ignoreIndices, setIgnoreIndices] = useState([]);
    const ignoreIndex = useCallback(
        (i) => {
            setIgnoreIndices(ignoreIndices => [...ignoreIndices, i]);
        },
        []
    );

    const objectClasses = useMemo(
        () => ({
            tableCell: {root: classes.expressionCellRoot},
            hoverError: {root: classes.hoverError},
            hoverGraphical: {root: classes.hoverGraphical},
            hoverObject: {root: classes.hoverObject},
        }),
        [classes]);

    const {includeTrace, includeConsole} =
        useMemo(
            () => {
                return {
                    includeTrace: options?.includes("trace"),
                    includeConsole: options?.includes("console")
                };
            },
            [options]
        );
    // const prevItemsRef = useRef();
    const [items, setItems] = useState(
        () => (new Array(data.length)).fill(false)
    );

    const itemIndexBoundariesRef = useRef({});
    const {isItemLoaded, loadMoreItems} =
        useMemo(
            () => {
                return {isItemLoaded: () => true, loadMoreItems: () => null};
                //   const {matchesFilterTrace} = searchState;
                //   // if (!isNew && prevItemsRef.current) {
                //   //    return prevItemsRef.current;
                //   // }
                // const _items = [...items];
                //   const isItemLoaded = (
                //      (index) => !!_items[index]
                //   );
                //   const loadMoreItems = ((startIndex, stopIndex) => {
                //      console.log({startIndex, stopIndex});
                //      return new Promise(resolve => {
                //         for (let index = startIndex; index < stopIndex; index++) {
                //            if (!index) {
                //               _items[index] = true;
                //            }
                //
                //            const n = data[index];
                //            const newN = {
                //               ...n, isMatch: true, value: n.entry?.entry?.logValue?.serialized
                //            };
                //
                //            newN.chunksResult = matchesFilterTrace(newN);
                //
                //            if (!newN.chunksResult.found || !newN.expression) {
                //               newN.isMatch = false;
                //            }
                //
                //            if (n.isError) {
                //               newN.isMatch = true;
                //            }
                //
                //            if (newN.isMatch) {
                //               _items[index] = createData(index, newN);
                //            } else {
                //               //ignoreIndex(index);
                //            }
                //           // console.log({startIndex, stopIndex, n, newN});
                //         }
                //         setItems(_items);
                //         resolve();
                //      });
                //   });
                //   return {isItemLoaded, loadMoreItems};
                // prevItemsRef.current = {items, isItemLoaded, loadMoreItems};
                // return prevItemsRef.current;
            },
            []
            // [ data,items, searchState, ignoreIndex]
        );


    useEffect(() => {
        let canceled = false;
        const dispose = requestAnimationFrameWhenIdle(
            () => {
                const {matchesFilterTrace} = searchState;
                const ignoreIndices = [];
                const matchedData = [];
                let consoleTotalMatches = 0;
                //console.log("X", data?.[1]?.entry);
                data.forEach(
                    (n, i) =>
                        // (
                        // async () =>
                    {
                        const isConsole = n.entry?.entry?.isConsole;

                        const newN = {
                            ...n,
                            isMatch: true,
                            value: n.entry?.entry?.logValue?.serialized
                        };

                        newN.chunksResult = matchesFilterTrace(newN);

                        if (!newN.chunksResult.found || !newN.expression) {
                            newN.isMatch = false;
                        }

                        if (n.isError) {
                            newN.isMatch = true;
                        }

                        if (newN.isMatch) {
                            const isConsoleMatch = includeConsole && isConsole;
                            if (isConsoleMatch || (includeTrace && !isConsole)) {
                                matchedData.push(createData(i, newN));
                            }
                            isConsoleMatch && consoleTotalMatches++;
                            // matchedData[i] = newN;

                        } else {
                            // ignoreIndices.push(i + 1);
                        }
                    }
                    // )
                );

                // promises.push(()=>new Promise((resolve)=>{setTimeout(resolve, 5000);}));

                return (
                    // async
                    () => {
                        // for (let promise of promises) {
                        //    if (canceled) {
                        //      // console.log("TRACELIST", data.length, matchedData);
                        //       break;
                        //    }
                        //    await promise();
                        // }
                        //     console.log("TRACELIST", data.length, matchedData, ignoreIndices, promises);
                        return {
                            items: matchedData,//.map((entry, i) => createData(i, entry)),
                            ignoreIndices,
                            consoleTotalMatches
                        }
                    })();


            },
            (timestamp, payload, error) => {
                if (error) {
                    console.log(error);
                    return;
                }
                const {items, ignoreIndices, consoleTotalMatches} = payload;
                setItems(items);
                setIgnoreIndices(ignoreIndices);
                setConsoleTotalMatches(consoleTotalMatches);
            }
        );

        return () => {
            if (canceled) {
                return;
            }
            canceled = true;
            dispose();
        }

    }, [data, searchState, includeTrace, includeConsole]);

    // const _prevItems = usePrevious(items);
    // const _prevOrder = usePrevious(order);
    // const _prevOrderBy = usePrevious(orderBy);
    // useEffect(
    //    () => {
    //       if (!_prevItems || !items) {
    //          return;
    //       }
    //
    //       const delta = items.length - _prevItems.length;
    //
    //       if (delta > 0) {
    //          order !== 'asc' && setStickyIndices(
    //             stickyIndices.map(
    //                i => i + delta
    //             )
    //          );
    //       } else {
    //          delta && setStickyIndices([]);
    //       }
    //
    //
    //    }
    //    , [stickyIndices, setStickyIndices, items, _prevItems, order, orderBy]
    // );

    // useEffect(
    //    () => {
    //       if (orderBy === 'time') {
    //          if (order !== _prevOrder) {
    //             order === 'asc' && setStickyIndices(
    //                //+1 due to sticky row container
    //                stickyIndices.map(i => items.length + 1 - i)
    //             );
    //          }
    //       } else {
    //          if (order !== _prevOrder || orderBy !== _prevOrderBy) {
    //             setStickyIndices([]);
    //          }
    //       }
    //    }
    //    , [
    //       stickyIndices, setStickyIndices, items,
    //       order, _prevOrder, orderBy, _prevOrderBy
    //    ]
    // );

    useEffect(
        () => {
            onHandleTotalChange?.(totalMatches);
            return () => null;
        },
        [totalMatches, onHandleTotalChange]
    );

    useEffect(
        () => {
            onHandleConsoleTotalChange?.(consoleTotalMatches);
            return () => null;
        },
        [consoleTotalMatches, onHandleConsoleTotalChange]
    );

    highlightErrors && highlightErrors();

    useEffect(
        () => {
            if (isNew) { //hard to know expression id between code edits
                setStickyIndices([]);
            }

            return () => null;
        }
        ,
        [isNew]
    );
    const {monacoTheme} = useContext(ThemeContext);
    const mRef = useRef();
    const alec = rest?.aleContext?.aleInstance?.getALECode()
    useEffect(() => {
            if (!mRef.current || !monaco || !alec) {
                return;
            }
            monaco.editor.colorizeElement(
                mRef.current
            );
            // const e = document.createElement("div");
            // mRef.current.appendChild(e);
            // monaco.editor.create( e, {
            //     value: alec,
            //     language: 'javascript',
            //     glyphMargin: true,
            //     contextmenu: false
            // });
            //
            // return ()=>{
            //     mRef.current.removeChild(e);
            // }
        },
        [monaco, alec, monacoTheme]
    );
    // console.log("TR>", items, alec);

    const listProps = {
        estimatedItemSize: TABLE_ROW_HEIGHT,
        items,
        itemsCache,
        autoScrollTo,
        StickyComponent: StickyAction,
        RowComponent: Row,
        RowContainer,
        isItemLoaded,
        loadMoreItems,
        stickyIndices,
        setStickyIndices,
        ignoreIndices,
        ignoreIndex,
        heightDelta,
        autoScroll,
        EmptyRowComponent: EmptyRow,
        objectClasses,
    };
    // console.log(listProps);
    return (
        // <pre ref={mRef} data-lang="text/javascript"
        //      style={{height:"800", width:"500",overflow:"scroll"}}
        // >
        //     {alec}
        // </pre>
        <StyledInfiniteStickyList {...listProps}/>
    );
}

export default withStyles(styles)(WindowedTable);
