import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {darken, fade, lighten} from '@material-ui/core/styles/colorManipulator';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Pin from "mdi-material-ui/Pin";
import PinOutline from "mdi-material-ui/PinOutline";

import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';

import InfiniteStickyList from './InfiniteStickyList';
import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext, TABLE_ROW_HEIGHT} from "../containers/Pastebin";
import {HighlightPalette} from '../containers/LiveExpressionStore';
import debounce from 'lodash/debounce';

// import {AutoSizer, Column, Table} from 'react-virtualized';
// import Highlighter from "react-highlight-words";

const styles = theme => ({
    row: {},
    sticky: {
        backgroundColor: theme.palette.background.default,
        position: 'sticky !important',
        zIndex: 1,
    },
    root: {
        width: '100%',
        height: '100%',
    },
    table: {
        minWidth: 'calc(100%)',
        // temporary right-to-left patch, waiting for
        // https://github.com/bvaughn/react-virtualized/issues/454
        '& .ReactVirtualized__Table__headerRow': {
            flip: false,
            paddingRight: theme.direction === 'rtl' ?
                '0px !important'
                : undefined,
        },
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    tableRow: {
        height: TABLE_ROW_HEIGHT,
        '&$hover:hover': {
            backgroundColor: HighlightPalette.text,
        },
        cursor: 'pointer',
    },
    tableRowError: {
        height: TABLE_ROW_HEIGHT,
        backgroundColor: fade(HighlightPalette.error, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        height: TABLE_ROW_HEIGHT,
        backgroundColor: fade(HighlightPalette.graphical, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.graphical,
        }
    },
    tableRowInput: {
        height: TABLE_ROW_HEIGHT,
    },
    hover: {},
    valueCell: {
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        borderBottom: 0,
    },
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
        color: theme.palette.type === 'light'
            ? lighten(fade(theme.palette.divider, 1), 0.6)
            : darken(fade(theme.palette.divider, 1), 0.4)
    },
    bottomValueCell: {
        borderTop: `1px solid ${
            theme.palette.type === 'light'
                ? lighten(fade(theme.palette.divider, 1), 0.88)
                : darken(fade(theme.palette.divider, 1), 0.8)
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
    tableCell: {
        flex: 1,
    },
    noClick: {
        cursor: 'initial',
    },
    rowContainer: {
        display: 'flex',
        alignItems: 'center',
        flexFlow: 'row',
    }
});

const configureMatchesFilter = (searchState) => {
        const findChunks = (textToHighlight) => {
            const searchWords = searchState.value.split(' ');
            return searchState.findChunks(
                {
                    searchWords,
                    textToHighlight
                }
            )
        };

        return (data) => {
            const result = {
                found: false,
                functions: [],
                expressions: [],
                values: [],
            };


            const isAnyText = !searchState.value.trim().length;

            if (isAnyText) {
                result.found = true;
                return result;
            }

            result.values = findChunks(data.expression);
            result.found = !!result.values.length;

            if (!result.found) {
                result.values = findChunks(data.value);
                result.found = !!result.values.length;
            }

            return result;
        }
    }
;

function createData(id, entry) {
    return {id, entry};
}

const RowContainer = React.forwardRef(
    ({isSticky, classes, children}, ref) =>
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


const Row = ({index, style, data}) => {
    const n = (data.items[index] || {}).entry || {};
    const {
        columnIndex, columns, classes, rowHeight, onRowClick,
        objectNodeRenderer, isRowSelected, highlightSingleText,
        traceSubscriber, HighlightTypes, setCursorToLocation
    } = data;
    const isSelected = n.id && isRowSelected(n.id);
    // const result = n.chunksResult;
    let onMouseEnter = null, onMouseLeave = null, onClick = null;
    if (!n.isFromInput) {


        onMouseEnter = () =>
            highlightSingleText(
                n.loc, n.isError ? HighlightTypes.error
                    : n.isGraphical ?
                        HighlightTypes.graphical : HighlightTypes.text,
                traceSubscriber.getMatches(n.funcRefId, n.dataRefId))
        onMouseLeave = () => highlightSingleText();
        onClick = () => setCursorToLocation(n.loc)
    }
    return (
        <TableCell
            component="div"
            classes={{root: classes.valueCell}}
            onClick={onClick}
            align={
                (columnIndex != null
                    && columns[columnIndex]
                    && columns[columnIndex].numeric
                ) || false ?
                    'right'
                    : 'left'
            }
        >
            <div className={classes.cellParamContainer}>
                {n.isFromInput ? n.isResult ?
                    <ChevronLeftIcon className={classes.icon}/>
                    : <ChevronRightIcon className={classes.icon}/>
                    : null
                }
                {(n.isFromInput && !n.isResult && !n.isError) ?
                    <div className={classes.commandText}>
                        {`${n.value[0]}`}
                    </div>
                    : (n.value || []).map((param, i) => {
                        return (
                            <div className={classes.cellParam} key={i}>
                                <ObjectExplorer key={i}
                                                expressionId={n.expressionId}
                                                objectNodeRenderer={
                                                    objectNodeRenderer
                                                }
                                                data={param}
                                />
                            </div>
                        );
                    })
                }
            </div>
        </TableCell>

    );
};

export const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);


const StickyAction = React.memo(({isSticky, onStickyChange}) => (
    <IconButton
        onClick={onStickyChange}
        size="small"
        style={{
            zIndex: isSticky ? 1 : 0,
            display: 'flex',
            alignItems: 'center',
            flexFlow: 'row',
        }}
    >
        {isSticky ? <Pin style={{fontSize: '.8rem'}}/> :
            <PinOutline style={{fontSize: '.8rem'}}/>}
    </IconButton>
));

function WindowedTable(props) {
    const {
        logData: data,
        searchState,
        onHandleTotalChange,
        objectNodeRenderer,
        isRowSelected,
        setCursorToLocation,
        heightDelta,
        autoScroll,
        defaultItemSize = 19,
    } = props;
    const [stickyIndices, setStickyIndices] = React.useState([]);
    const findChunks = React.useMemo(
        () => configureMatchesFilter(searchState),
        [searchState]
    );
    let totalMatches = 0;
    const windowData = data.map(() => false);
    const ignoreIndices = [];
    const matchedData = [];
    data.forEach((n, i) => {
        const newN = {...n, isMatch: true, chunksResult: findChunks(n)};
        if (
            !newN.chunksResult.found || (!newN.isFromInput && !newN.expression)
        ) {
            newN.isMatch = false;
        }
        if (newN.isMatch || newN.isFromInput) {
            matchedData.push(newN);
        } else {
            ignoreIndices.push(i);
        }
    });
    totalMatches = matchedData.length;
    React.useEffect(
        () => onHandleTotalChange(totalMatches),
        [totalMatches]
    );
    const rows = matchedData.map((entry, i) => createData(i, entry));

    const isItemLoaded = index => true;//!!rows[index];
    const loadMoreItems = (startIndex, stopIndex) => {
        // for (let index = startIndex; index <= stopIndex; index++) {
        //     windowData[index] = rows[index];
        // }
        return new Promise(
            resolve => resolve()
        );
    };

    const listProps = {
        items: rows,
        defaultItemSize,
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
    };
    return (
        <StyledInfiniteStickyList
            {...listProps}
        />

    );
}

WindowedTable.propTypes = {
    headerHeight: PropTypes.number,
    onHandleTotalChange: PropTypes.func,
    heightDelta: PropTypes.number,
    autoScroll: PropTypes.bool,
};

// const debouncedWindowedTableWithContext = debounce(
//     (props, context) => {
//         return <WindowedTable {...props} {...context}/>
//     }, 50, {maxWait: 100})
//
// {context => debouncedWindowedTableWithContext(props, context)}
const WindowedTableWithContext = props => (
    <PastebinContext.Consumer>
        {(
            context
            // {
            //     logData,
            //     searchState,
            //     objectNodeRenderer,
            //     isRowSelected,
            //     setCursorToLocation
            // }
        ) => <WindowedTable
            {...props}
            {...context}
            // logData={[] || logData}
            // searchState={searchState}
            // objectNodeRenderer={objectNodeRenderer}
            // isRowSelected={isRowSelected}
            // setCursorToLocation={setCursorToLocation}
        />
        }
    </PastebinContext.Consumer>
);


export default withStyles(styles)(WindowedTableWithContext);
