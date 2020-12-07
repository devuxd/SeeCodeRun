import React, {useState, useEffect, useMemo, useCallback, forwardRef} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {darken, alpha, lighten} from '@material-ui/core/styles/colorManipulator';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import InfiniteStickyList from './InfiniteStickyList';
import ObjectExplorer from "./ObjectExplorer";
import {StickyAction} from "./TraceList";

import {PastebinContext, TABLE_ROW_HEIGHT} from "../containers/Pastebin";
import {HighlightPalette} from '../containers/LiveExpressionStore';

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
        backgroundColor: alpha(HighlightPalette.error, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        height: TABLE_ROW_HEIGHT,
        backgroundColor: alpha(HighlightPalette.graphical, 0.25),
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
        padding: theme.spacing(1),
        borderBottom: 0,
    },
    valueCellFill: {
        width: '100%',
        overflow: 'hidden',
        margin: 0,
        padding: theme.spacing(1),
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

const RowContainer = forwardRef(
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
        columnIndex, columns, classes,
        objectNodeRenderer,
        configureMappingEventListeners
    } = data;

    const {
        onMouseEnter, onMouseLeave,
    } = configureMappingEventListeners(n);
    const tableClasses = useMemo(
        () => ({root: classes.valueCell}
        ), [classes]);
    return (
        <TableCell
            component="div"
            classes={tableClasses}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            // onClick={onClick}
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
                                                variant={"marker"}
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
                No console logs yet.
            </TableCell>
        </TableRow>
    );
});

export const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

function WindowedTable(props) {
    const {
        order,
        estimatedItemSize = 29,
        logData: data,
        searchState,
        configureMappingEventListeners,
        onHandleTotalChange,
        objectNodeRenderer,
        isRowSelected,
        setCursorToLocation,
        heightDelta,
        autoScroll,
    } = props;
    const [stickyIndices, setStickyIndices] = useState([]);
    const findChunks = useMemo(
        () => configureMatchesFilter(searchState),
        [searchState]
    );

    const {
        totalMatches, ignoreIndices, rows
    } = useMemo(() => {
            const windowData = data.map(() => false);
            const ignoreIndices = [];
            const matchedData = [];
            data.forEach((n, i) => {
                const newN = {...n, isMatch: true, chunksResult: findChunks(n)};
                if (
                    !newN.chunksResult.found
                    || (!newN.isFromInput && !newN.expression)
                ) {
                    newN.isMatch = false;
                }
                if (newN.isMatch || newN.isFromInput) {
                    matchedData.push(newN);
                } else {
                    ignoreIndices.push(i);
                }
            });
            return {
                totalMatches: matchedData.length,
                rows: matchedData
                    .map((entry, i) => createData(i, entry)),
                ignoreIndices,
                windowData
            }
        }
        , [data, findChunks]);

    useEffect(
        () => {
            onHandleTotalChange(totalMatches)
        },
        [totalMatches, onHandleTotalChange]
    );

    const isItemLoaded = useCallback(index => true, []);//!!rows[index];
    const loadMoreItems = useCallback((startIndex, stopIndex) => {
        // for (let index = startIndex; index <= stopIndex; index++) {
        //     windowData[index] = rows[index];
        // }
        return new Promise(
            resolve => resolve()
        );
    }, []);

    const autoScrollTo = order === 'asc' ? 'bottom' : 'top';

    const listProps = useMemo(() => ({
        autoScrollTo,
        items: rows,
        estimatedItemSize,
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
        configureMappingEventListeners,
        EmptyRowComponent: EmptyRow,
    }), [
        autoScrollTo,
        rows,
        estimatedItemSize,
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
        configureMappingEventListeners,
    ]);
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

const WindowedTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => <WindowedTable {...props} {...context}/>}
    </PastebinContext.Consumer>
);


export default withStyles(styles)(WindowedTableWithContext);
