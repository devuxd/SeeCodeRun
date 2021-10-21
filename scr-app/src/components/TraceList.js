import React, {
   forwardRef,
   useRef,
   useCallback,
   useEffect,
   useMemo,
   useState,
   useContext
} from 'react';
import {withStyles} from '@mui/styles';
import {alpha, darken, lighten} from '@mui/material/styles';

import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Highlighter from 'react-highlight-words';

import InfiniteStickyList from './InfiniteStickyList';


import PastebinContext from '../contexts/PastebinContext';
import {TABLE_ROW_HEIGHT} from '../containers/Pastebin';
import {
   configureGoToTimelineBranch,
} from '../containers/LiveExpressionStore';
import OverflowComponent from './OverflowComponent';
import {ThemeContext, ThemesRef} from '../themes';
import {useMeasureBeforeMount, usePrevious} from '../utils/reactUtils';
import {StickyAction, defaultFloatyMoreIcon} from './StickyAction';
import ALEInspector from '../core/modules/RALE/ALEInspector';


const CodeFragment = (
   {
      text = '',
      monaco = global.monaco,
      dataLang = "javascript",
      disableOneLineText = false
   }
) => {
   const {monacoTheme} = useContext(ThemeContext);
   const ref = useRef();
   const sourceText = useMemo(
      () => (disableOneLineText ?
            text
            : text.replace(
               /[\r\n\x0B\x0C\u0085\u2028\u2029]+/g,
               ''
            )
      ),
      [text, disableOneLineText]
   );
   
   useEffect(
      () => {
         if (!ref.current || !monaco) {
            return;
         }
         
         monaco.editor.colorizeElement(ref.current, {theme: monacoTheme});
      },
      [text, monaco, monacoTheme]);
   
   return (
      <div key={monacoTheme} ref={ref} data-lang={dataLang}>{sourceText}</div>);
   
}

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
      searchWords, searchState,
      goToTimelineBranch, configureMappingEventListeners,
      columnStyles = rowColumnStylesDefault,
      items,
   } = data;
   
   const [isPending, /*setIsPending*/] = useState(false);
   const [hasMore, setHasMore] = useState(false);
   
   const isValid = !!index;
   
   const item = isValid && items?.[index];
   const n = item?.entry;
   const result = n?.chunksResult;
   const isSearchActive = searchState?.checkSearchActive?.();
   const isMatch = isSearchActive && n?.isMatch;
   const expressionId = n?.entry?.expressionId ?? '';
   const cacheId = `${expressionId}`;
   
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
                     {isMatch ?
                        
                        <Highlighter
                           // highlightClassName={classes.highlight}
                           searchWords={searchWords}
                           textToHighlight={n?.expression || ''}
                           autoEscape={true}
                           findChunks={findChunks}
                        />
                        : <CodeFragment text={n?.expression || ''}/>
                     }
                  </Typography>
               </ButtonBase>
            </OverflowComponent>
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
            style={isPending ?
               rowColumnStylesResizingDefault[1] : columnStyles[1]
            }
         >
            <ALEInspector
               cacheId={cacheId}
               connectorVariant={"marker"}
               aleObject={n?.entry?.entry?.logValue}
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
   // console.log(props);
   
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
      // console.log("data", data, matchedData);
      
      return {
         totalMatches: matchedData.length,
         items: matchedData.map((entry, i) => createData(i, entry)),
         ignoreIndices,
         searchWords: [value],
      }
   }, [data, searchState]);
   
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
