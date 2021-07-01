import React, {
   forwardRef,
   useCallback,
   useEffect,
   useMemo,
   useState,
   useContext
} from 'react';
import isString from 'lodash/isString';
import {withStyles} from '@material-ui/styles';
import {alpha, darken, lighten} from '@material-ui/core/styles';

import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Highlighter from 'react-highlight-words';

import JSEN from '../utils/JSEN';

import InfiniteStickyList from './InfiniteStickyList';
import ObjectExplorer from './ObjectExplorer';

import {PastebinContext, TABLE_ROW_HEIGHT} from '../containers/Pastebin';
import {
   configureGoToTimelineBranch,
} from '../containers/LiveExpressionStore';
import OverflowComponent from './OverflowComponent';
import {ThemesRef} from '../themes';
import {usePrevious} from '../utils/reactUtils';
import ObjectExplorersContext from "./ObjectExplorersContext";
import {StickyAction, defaultFloatyMoreIcon} from './StickyAction';

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
         margin: 0,
         padding: theme.spacing(0.5),
      },
      valueCell: {
         margin: 0,
         padding: theme.spacing(0.5),
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
            display: 'none' /* Hide scrollbar for IE, Edge and Firefox */
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

const RowContainer = forwardRef(
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
);

const rowColumnStylesDefault = ([
   {
      flex: 1,
   },
   {
      flex: 3,
   },
]);

const rowColumnStylesResizingDefault = ([
   {
      flex: 1,
   },
   {
      flex: 3,
      maxHeight: 26,
      overflowY: 'hidden',
   },
]);

const Row = ({index, data}) => {
   const {
      classes, objectClasses,
      objectNodeRenderer, searchWords, searchState,
      goToTimelineBranch, configureMappingEventListeners,
      columnStyles = rowColumnStylesDefault,
      items,
   } = data;
   
   const [cache] = useContext(ObjectExplorersContext);
   
   const [isPending, /*setIsPending*/] = useState(false);
   const [hasMore, setHasMore] = useState(false);
   
   const isValid = !!index;
   
   const item = isValid && items?.[index];
   const n = item?.entry;
   const result = n?.chunksResult;
   
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
   
   
   const cacheId = `${n?.entry?.i ?? ''}`;
   
   const {parsedValue, outputRefs} = useMemo(
      () => {
         if (!cacheId) {
            
            return {
               parsedValue: (isString(n?.value) ?
                  JSEN.parse(n?.value) : n?.value),
               outputRefs: (n?.entry?.outputRefs ?? []),
            };
         }
         
         cache[cacheId] = cache[cacheId]?? {current: {}};
         
         if (!cache[cacheId].current.hasParsedValue) {
            cache[cacheId].current.parsedValue = isString(n?.value) ?
               JSEN.parse(n?.value) : n?.value;
            cache[cacheId].current.hasParsedValue = true;
         }else{
            // console.log('D', cacheId)
         }
         
         if (!cache[cacheId].current.outputRefs) {
            cache[cacheId].current.outputRefs = n?.entry?.outputRefs ?? [];
         }
         
         return {
            parsedValue: cache[cacheId].current.parsedValue,
            outputRefs: cache[cacheId].current.outputRefs,
         };
         
      },
      [n, cache, cacheId]
   );
   
   const isSearchActive = searchState?.checkSearchActive?.();
   const searchValue = searchState?.value;
   
   useMemo(
      () => {
         if (cache[cacheId]?.current) {
            if (isSearchActive) {
               // cache[cacheId].current.disableCache = true;
               
               if (cache[cacheId].current.isMounted
                  && !cache[cacheId].current.beforeSearchCache) {
                  cache[cacheId].current.beforeSearchCache =
                     cache[cacheId].current.stateAndSetter?.[0] ?? {};
                  
               }
            } else {
               // cache[cacheId].current.disableCache = false;
            }
         }
      },
      [isSearchActive]
   );
   
   useEffect(
      () => {
         if (cache[cacheId]?.current) {
            if (!isSearchActive) {
               if (cache[cacheId].current.isMounted) {
                  const beforeSearchCache =
                     cache[cacheId].current.beforeSearchCache;
                  if (beforeSearchCache) {
                     cache[cacheId].current.stateAndSetter?.[1](
                        beforeSearchCache
                     );
                     delete cache[cacheId].current.beforeSearchCache;
                  }
               }
            }
         }
      },
      [isSearchActive]
   );
   
   useEffect(
      () => {
         if (cache[cacheId]?.current) {
            if (searchValue) {
               const tid = setTimeout(
                  () => {
                     if (cache[
                        cacheId
                        ].current.stateAndSetter?.[0]?.pending?.length) {
                        setHasMore(
                           cache[cacheId].current.hasMore && true);
                     } else {
                        setHasMore(false);
                     }
                  }, 500);
               
               return () => clearTimeout(tid);
            } else {
               setHasMore(false);
               cache[cacheId].current.hasMore = true;
            }
         }
      },
      [searchValue]
   );
   
   // useEffect(
   //    () => {
   //       const expandedPaths =
   //          cache?.[cacheId]?.current?.stateAndSetter?.[0];
   //       if (expandedPaths) {
   //          if (cache[cacheId].current.isMounted) {
   //             const n = expandedPaths.pending?.length;
   //             if (n) {
   //                let tids = []
   //                let i = 0;
   //                const chained = () => {
   //                   const currentPending =
   //                      cache[cacheId].current.stateAndSetter?.[0].pending?.[i];
   //                   if (currentPending) {
   //                      console.log('Z');
   //                      tids.push(
   //                         setTimeout(
   //                            () => {
   //                               const expandedPaths =
   //                                  cache[cacheId].current.stateAndSetter?.[0];
   //                               if (cache[cacheId].current.isMounted &&
   //                                  expandedPaths.pending) {
   //                                  // console.log(cacheId, index*10);
   //                                  if (expandedPaths.pending?.[i]) {
   //                                     console.log('A');
   //                                     setIsPending(true);
   //                                     cache[
   //                                        cacheId
   //                                        ].current.stateAndSetter?.[1](
   //                                        p => ({...p, ...currentPending()})
   //                                     );
   //                                     expandedPaths.pending[i] = null;
   //
   //                                     i++;
   //                                     if (i < n) {
   //                                        chained();
   //                                     } else {
   //                                        console.log('B');
   //                                        expandedPaths.pending = null;
   //                                        setIsPending(false);
   //                                     }
   //
   //                                  }
   //                               }
   //                            },
   //                            100)
   //                      );
   //                   }
   //                };
   //
   //                chained();
   //
   //                return () => {
   //                   console.log('C');
   //                   tids.forEach(tid => clearTimeout(tid));
   //                };
   //             } else {
   //                console.log('D');
   //                setIsPending(false);
   //             }
   //          }
   //       }
   //    },
   //    [expandedPaths, index]
   // );
   
   const onHover = useCallback(
      (event) => {
         onMouseEnter(event);
         
         const expandedPaths = cache?.[cacheId]?.current?.stateAndSetter?.[0];
         if (expandedPaths) {
            if (cache[cacheId].current.isMounted) {
               const n = expandedPaths.pending?.length;
               if (n) {
                  clearTimeout(cache.expandedPathsTi);
                  cache.expandedPathsTi = setTimeout(
                     () => {
                        let current = {};
                        expandedPaths.pending.forEach(currentPending => {
                           current = ({...current, ...currentPending()});
                        });
                        cache[
                           cacheId
                           ].current.stateAndSetter?.[1](
                           p => {
                              const newExpandedPaths = {...p, ...current};
                              newExpandedPaths.pending = null;
                              return newExpandedPaths;
                           }
                        );
                     }, 250);
                  return () => clearTimeout(cache.expandedPathsTi);
               }
            }
         }
      },
      [cache, onMouseEnter]
   );
   
   return (isValid && <>
         <TableCell
            component="div"
            classes={objectClasses.tableCell}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={isPending ?
               rowColumnStylesResizingDefault[0] : columnStyles[0]
            }
         >
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
                     <Highlighter
                        // highlightClassName={classes.highlight}
                        searchWords={searchWords}
                        textToHighlight={n?.expression || ''}
                        autoEscape={true}
                        findChunks={findChunks}
                     />
                  </Typography>
               </ButtonBase>
            </OverflowComponent>
         </TableCell>
         <TableCell
            component="div"
            className={classes.valueCell}
            classes={
               n?.isError ? objectClasses.hoverError
                  : n?.isGraphical ? objectClasses.hoverGraphical
                  : objectClasses.hoverObject
            }
            onMouseEnter={onHover}
            onMouseLeave={onMouseLeave}
            style={isPending ?
               rowColumnStylesResizingDefault[1] : columnStyles[1]
            }
         >
            <ObjectExplorer
               variant={"marker"}
               expressionId={n?.expressionId}
               objectNodeRenderer={objectNodeRenderer}
               data={parsedValue}
               outputRefs={outputRefs}
               expandedPathsRef={cache[cacheId]}
               getExpandedPaths={searchState?.getExpandedPaths}
            />
            {hasMore && defaultFloatyMoreIcon}
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

function WindowedTable(props) {
   const {
      order,
      orderBy,
      data, searchState, onHandleTotalChange, objectNodeRenderer,
      handleSelectClick, isRowSelected,
      highlightSingleText, setCursorToLocation,
      traceSubscriber,
      heightDelta, autoScroll, isNew, highlightErrors,
      configureMappingEventListeners,
      classes,
   } = props;
   
   const [stickyIndices, setStickyIndices] = useState([]);
   
   useEffect(
      () => {
         //hard to know expression id between code edits
         isNew && setStickyIndices([]);
      }
      , [isNew]);
   
   const objectClasses = useMemo(
      () => ({
         tableCell: {root: classes.expressionCellRoot},
         hoverError: {root: classes.hoverError},
         hoverGraphical: {root: classes.hoverGraphical},
         hoverObject: {root: classes.hoverObject},
      }),
      [classes]);
   
   const {
      totalMatches, ignoreIndices, items, searchWords,
   } = useMemo(() => {
      const {value, matchesFilterTrace} = searchState;
      const ignoreIndices = [];
      const matchedData = [];
      data.forEach((n, i) => {
         const newN = {
            ...n, isMatch: true, chunksResult: matchesFilterTrace(n)
         };
         
         if (!newN.chunksResult.found || !newN.expression) {
            newN.isMatch = false;
         }
         
         if (n.isError) {
            newN.isMatch = true;
         }
         
         if (newN.isMatch) {
            matchedData.push(newN);
         } else {
            ignoreIndices.push(i);
         }
      });
      
      return {
         totalMatches: matchedData.length,
         items: matchedData.map((entry, i) => createData(i, entry)),
         ignoreIndices,
         searchWords: [value],
      }
   }, [data, searchState]);
   
   const _prevItems = usePrevious(items);
   const _prevOrder = usePrevious(order);
   const _prevOrderBy = usePrevious(orderBy);
   useEffect(
      () => {
         if (!_prevItems || !items) {
            return;
         }
         
         const delta = items.length - _prevItems.length;
         
         if (delta > 0) {
            order !== 'asc' && setStickyIndices(
               stickyIndices.map(
                  i => i + delta
               )
            );
         } else {
            delta && setStickyIndices([]);
         }
         
         
      }
      , [stickyIndices, setStickyIndices, items, _prevItems, order, orderBy]
   );
   
   useEffect(
      () => {
         if (orderBy === 'time') {
            if (order !== _prevOrder) {
               order === 'asc' && setStickyIndices(
                  //+1 due to sticky row container
                  stickyIndices.map(i => items.length + 1 - i)
               );
            }
         } else {
            if (order !== _prevOrder || orderBy !== _prevOrderBy) {
               setStickyIndices([]);
            }
         }
      }
      , [
         stickyIndices, setStickyIndices, items,
         order, _prevOrder, orderBy, _prevOrderBy
      ]
   );
   
   useEffect(
      () => {
         onHandleTotalChange(totalMatches)
      },
      [totalMatches, onHandleTotalChange]
   );
   
   highlightErrors && highlightErrors();
   
   const goToTimelineBranch = configureGoToTimelineBranch;
   
   const isItemLoaded = useCallback((/*index*/) => true, []);//!!items[index];
   const loadMoreItems = useCallback((/*startIndex, stopIndex*/) => {
      return new Promise(resolve => resolve());
   }, []);
   
   const autoScrollTo = order === 'asc' ? 'bottom' : 'top';
   
   const listProps = {
      estimatedItemSize: TABLE_ROW_HEIGHT,
      items,
      autoScrollTo,
      StickyComponent: StickyAction,
      RowComponent: Row,
      RowContainer,
      isItemLoaded,
      loadMoreItems,
      stickyIndices,
      setStickyIndices,
      ignoreIndices,
      isRowSelected,
      objectNodeRenderer,
      setCursorToLocation,
      heightDelta,
      autoScroll,
      handleSelectClick,
      highlightSingleText,
      searchState,
      searchWords,
      goToTimelineBranch,
      traceSubscriber,
      configureMappingEventListeners,
      EmptyRowComponent: EmptyRow,
      objectClasses,
   };
   return (<StyledInfiniteStickyList {...listProps}/>);
}

const WindowedTableWithContext = props => (
   <PastebinContext.Consumer>
      {(context) => <WindowedTable {...props} {...context}/>}
   </PastebinContext.Consumer>
);

export default withStyles(styles)(WindowedTableWithContext);
