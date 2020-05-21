import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {fade, lighten, darken} from '@material-ui/core/styles/colorManipulator';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';

import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import clsx from 'clsx';
import {AutoSizer, Column, Table} from 'react-virtualized';
// import Highlighter from "react-highlight-words";


import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext, TABLE_ROW_HEIGHT} from "../containers/Pastebin";
import {HighlightPalette} from '../containers/LiveExpressionStore';

const columnData = [
    {id: 'value', numeric: false, className: 'cellPadding', label: ''/*'Value'*/, colSpan: 1},
];

const columnDataAutosize = [
    {
        id: 'value',
        dataKey: 'entry',
        numeric: false,
        className: 'cellPadding',
        label: ''/*'Value'*/,
        colSpan: 1,
        width: (width) => width,
    },
];

const createSortHandler = ({onRequestSort}, property) => event => {
    onRequestSort && onRequestSort(event, property);
};


class ConsoleTableHead extends React.Component {
    render() {
        const {isSelectable, onSelectAllClick, order, orderBy, numSelected, rowCount, classes} = this.props;

        return (
            <TableHead>
                <TableRow className={classes.tableHeadRow}>
                    {isSelectable &&
                    <TableCell padding="checkbox">
                        <Checkbox
                            indeterminate={numSelected > 0 && numSelected < rowCount}
                            checked={numSelected === rowCount}
                            onChange={onSelectAllClick}
                            padding="none"
                        />
                    </TableCell>
                    }
                    {columnData.map(column => {
                        return (
                            <TableCell
                                key={column.id}
                                align={column.numeric ? 'right' : 'inherit'}
                                className={classes[column.className]}
                                sortDirection={orderBy === column.id ? order : false}
                            >
                                <Tooltip
                                    title="Sort"
                                    placement={column.numeric ? 'bottom-end' : 'bottom-start'}
                                    enterDelay={300}
                                >
                                    <TableSortLabel
                                        active={orderBy === column.id}
                                        direction={order}
                                        onClick={createSortHandler(this.props, column.id)}
                                    >
                                        {column.label}
                                    </TableSortLabel>
                                </Tooltip>
                            </TableCell>
                        );
                    }, this)}
                </TableRow>
            </TableHead>
        );
    }
}

ConsoleTableHead.propTypes = {
    isSelectable: PropTypes.bool.isRequired,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};


const styles = theme => ({
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
            paddingRight: theme.direction === 'rtl' ? '0px !important' : undefined,
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
        borderBottom: 0,
        paddingLeft: theme.spacing(1),
        '&:first-child': {
            paddingLeft: theme.spacing(4),
        },
        '&:last-child': {
            paddingRight: theme.spacing(2),
        },
        overflow: 'hidden',
        margin: 0,
        paddingTop: 0,
        paddingBottom: 0,
    },
    bottomAction: {
        margin: theme.spacing(4),
    },
    cellParamContainer: {
        //display: 'box',
        // display: 'inline-block',
        position: 'relative',
        // flexDirection: 'row',
        // flexWrap: 'wrap',
        // overflowX: 'auto',
        // padding: theme.spacing(1),
        // paddingBottom: theme.spacing(1),
    },
    cellParam: {
        display: 'inline-flex',
        marginLeft: theme.spacing(1),
    },
    iconContainer: {
        position: 'absolute',
        left: 0,
        marginLeft: theme.spacing(-3),
        top: 0,
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
});

const configureMatchesFilter = (searchState) => {
        const findChunks = (textToHighlight) => {
            const searchWords = searchState.value.split(' ');
            return searchState.findChunks({searchWords, textToHighlight})
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

class ConsoleTable extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
    }

    labelDisplayedRows =
        ({count}) => !count ? 'No results' : 'End of results';

    // ({to, count}) => count ? (to === count) ? 'End of results' : 'Scroll for more results' : 'No results';


    render() {

        const {
            classes, open,
            logData, objectNodeRenderer, order, orderBy, selected, page, isSelectable,
            handleSelectClick, handleSelectAllClick, handleRequestSort, isRowSelected, searchState,
            HighlightTypes, highlightSingleText, setCursorToLocation, traceSubscriber, handleChangePlaying,
        } = this.props;


        if (this.searchState !== searchState) {
            this.searchState = searchState;
            this.findChunks = configureMatchesFilter(searchState);
        }
        this.totalMatches = 0;
        const data = logData;
        let matchedData = data.map(n => {
            const newN = {...n, isMatch: true, chunksResult: this.findChunks(n)};
            if (!newN.chunksResult.found || (!newN.isFromInput && !newN.expression)) {
                newN.isMatch = false;
            }
            return newN;
        });
        matchedData = matchedData.filter(n => n.isMatch || n.isFromInput);
        this.totalMatches = matchedData.length;
        const emptyRows = 0;//rowsPerPage - Math.min(rowsPerPage, matchedData.length - page * rowsPerPage);
        return (
            <Paper className={classes.root} style={{display: open ? 'block' : 'none'}}>
                <div ref={this.containerRef} className={classes.tableWrapper}>
                    <Table className={classes.table}>
                        <ConsoleTableHead
                            isSelectable={isSelectable}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={data.length}
                            classes={classes}
                        />
                        <TableBody onMouseEnter={() => handleChangePlaying('table', false)}
                                   onMouseLeave={() => handleChangePlaying('table', true)}
                        >
                            {matchedData.map(n => {
                                const isSelected = isRowSelected(n.id);
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

                                return (<TableRow
                                    hover
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    tabIndex={-1}
                                    key={n.id}
                                    selected={isSelected}
                                    classes={{
                                        root: n.isError ? classes.tableRowError
                                            : n.isGraphical ?
                                                classes.tableRowGraphical : n.isFromInput ? classes.tableRowInput : classes.tableRow,
                                        hover: classes.hover
                                    }}
                                >
                                    {isSelectable &&
                                    <TableCell padding="checkbox"
                                               onClick={event => handleSelectClick(event, n.id)}>
                                        <Checkbox checked={isSelected} padding={'none'}/>
                                    </TableCell>
                                    }
                                    <TableCell classes={{root: classes.valueCell}} onClick={onClick}>
                                        <div className={classes.cellParamContainer}>
                                            {n.isFromInput && (<div
                                                className={classes.iconContainer} key="ChevronLeftIcon">
                                                {n.isResult ?
                                                    <ChevronLeftIcon className={classes.icon}/>
                                                    : <ChevronRightIcon className={classes.icon}/>}
                                            </div>)}
                                            {(n.isFromInput && !n.isResult && !n.isError) ?
                                                <div className={classes.commandText}>{`${n.value[0]}`}</div>
                                                : (n.value || []).map((param, i) => {
                                                    return (
                                                        <div className={classes.cellParam} key={i}>
                                                            <ObjectExplorer
                                                                expressionId={n.expressionId}
                                                                objectNodeRenderer={objectNodeRenderer}
                                                                data={param}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </TableCell>
                                </TableRow>);
                            })}
                            {emptyRows > 0 && (
                                <TableRow style={{height: TABLE_ROW_HEIGHT * emptyRows}}>
                                    <TableCell colSpan={isSelectable ? 2 : 1}/>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    colSpan={isSelectable ? 2 : 1}
                                    count={this.totalMatches}
                                    rowsPerPageOptions={[]}
                                    rowsPerPage={this.totalMatches}
                                    page={page}
                                    onChangePage={() => {
                                    }}
                                    onChangeRowsPerPage={() => {
                                    }}
                                    labelDisplayedRows={this.labelDisplayedRows}
                                    ActionsComponent={() => <span className={classes.bottomAction}/>}
                                    className={classes.bottomValueCell}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </Paper>
        );
    }


    //todo: mantain scroll position, trigger adjust row heights
    componentDidUpdate() {
        const {onHandleTotalChange} = this.props;
        if (onHandleTotalChange && this.consoleTotal !== this.totalMatches) {
            this.consoleTotal = this.totalMatches;
            onHandleTotalChange(this.consoleTotal);
        }
    }
}

ConsoleTable.propTypes = {
    classes: PropTypes.object.isRequired,
    onHandleTotalChange: PropTypes.func,
};

ConsoleTable.defaultProps = {
    page: 0,
};

const ConsoleTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <ConsoleTable {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);


class MuiVirtualizedTable extends React.PureComponent {
    static defaultProps = {
        headerHeight: 48,
        rowHeight: 48,
    };

    getRowClassName = ({index}) => {
        const {classes, onRowClick} = this.props;

        return clsx(classes.tableRow, classes.flexContainer, {
            [classes.tableRowHover]: index !== -1 && onRowClick != null,
        });
    };

    cellRenderer = ({cellData: n, columnIndex}) => {
        const {columns, classes, rowHeight, onRowClick, objectNodeRenderer, isRowSelected, highlightSingleText, traceSubscriber, HighlightTypes, setCursorToLocation} = this.props;
        const isSelected = isRowSelected(n.id);
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
                variant="body"
                // style={{height: rowHeight}}
                classes={{root: classes.valueCell}}
                onClick={onClick}
                align={(columnIndex != null && columns[columnIndex].numeric) || false ? 'right' : 'left'}
            >
                <div className={classes.cellParamContainer}>
                    {n.isFromInput && (<div
                        className={classes.iconContainer} key="ChevronLeftIcon">
                        {n.isResult ?
                            <ChevronLeftIcon className={classes.icon}/>
                            : <ChevronRightIcon className={classes.icon}/>}
                    </div>)}
                    {(n.isFromInput && !n.isResult && !n.isError) ?
                        <div className={classes.commandText}>{`${n.value[0]}`}</div>
                        : (n.value || []).map((param, i) => {
                            return (
                                <div className={classes.cellParam} key={i}>
                                    <ObjectExplorer
                                        expressionId={n.expressionId}
                                        objectNodeRenderer={objectNodeRenderer}
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

    headerRenderer = ({label, columnIndex}) => {
        const {
            headerHeight, columns, isSelectable, onSelectAllClick, order, orderBy, numSelected, rowCount, classes
        } = this.props;
        const column = columns[columnIndex];
        return (
            // <TableCell
            //     component="div"
            //     className={clsx(classes.tableCell, classes.flexContainer, classes.noClick)}
            //     variant="head"
            //     style={{height: headerHeight}}
            //     align={columns[columnIndex].numeric || false ? 'right' : 'left'}
            // >
            //     <span>{label}</span>
            // </TableCell>
            <TableCell
                variant="head"
                key={column.id}
                align={column.numeric ? 'right' : 'inherit'}
                className={classes[column.className]}
                sortDirection={orderBy === column.id ? order : false}
            >
                <Tooltip
                    title="Sort"
                    placement={column.numeric ? 'bottom-end' : 'bottom-start'}
                    enterDelay={300}
                >
                    <TableSortLabel
                        active={orderBy === column.id}
                        direction={order}
                        onClick={createSortHandler(this.props, column.id)}
                    >
                        {column.label}
                    </TableSortLabel>
                </Tooltip>
            </TableCell>
        );
    };

    render() {
        const {classes, columns, rowHeight, headerHeight, handleRequestSort, tabIndex, ...tableProps} = this.props;
        // console.log('tableProps',tableProps);
        return (
            <AutoSizer>
                {({height, width}) => (
                    <Table
                        height={height}
                        width={width}
                        rowHeight={rowHeight}
                        gridStyle={{
                            direction: 'inherit',
                        }}
                        headerHeight={headerHeight}
                        className={classes.table}
                        {...tableProps}
                        rowClassName={this.getRowClassName}
                    >
                        {columns.map(({dataKey, width: columnWidth, ...other}, index) => {
                            return (
                                <Column
                                    key={dataKey}
                                    // headerRenderer={(headerProps) =>
                                    //     this.headerRenderer({
                                    //         ...headerProps,
                                    //         columnIndex: index,
                                    //     })
                                    // }
                                    className={classes.flexContainer}
                                    cellRenderer={this.cellRenderer}
                                    dataKey={dataKey}
                                    width={isNaN(columnWidth) ? columnWidth(width) : columnWidth}
                                    {...other}
                                />
                            );
                        })}
                    </Table>
                )}
            </AutoSizer>
        );
    }
}

MuiVirtualizedTable.propTypes = {
    classes: PropTypes.object.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            dataKey: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            numeric: PropTypes.bool,
            width: PropTypes.oneOfType([
                PropTypes.number,
                PropTypes.func,
            ]).isRequired,
        }),
    ).isRequired,
    headerHeight: PropTypes.number,
    onRowClick: PropTypes.func,
    rowHeight: PropTypes.number,
    onRequestSort: PropTypes.func.isRequired,
};

const VirtualizedTable = withStyles(styles)(MuiVirtualizedTable);

function createData(id, entry) {
    return {id, entry};
}


function ReactVirtualizedTable(props) {
    const {
        classes, logData: data, handleRequestSort, searchState, onHandleTotalChange,
        open,objectNodeRenderer, order, orderBy, selected, page, isSelectable,
        handleSelectClick, handleSelectAllClick, isRowSelected,
        HighlightTypes, highlightSingleText, setCursorToLocation, traceSubscriber, handleChangePlaying,
    } = props;
    const findChunks = React.useMemo(() => configureMatchesFilter(searchState), [searchState]);
    let totalMatches = 0;
    let matchedData = data.map(n => {
        const newN = {...n, isMatch: true, chunksResult: findChunks(n)};
        if (!newN.chunksResult.found || (!newN.isFromInput && !newN.expression)) {
            newN.isMatch = false;
        }
        return newN;
    });
    matchedData = matchedData.filter(n => n.isMatch || n.isFromInput);
    totalMatches = matchedData.length;
    React.useEffect(
        () => onHandleTotalChange(totalMatches),
        [totalMatches]
    );
    const rows = matchedData.map((entry, i) => createData(i, entry));

    return (
        <VirtualizedTable
            rowCount={matchedData.length}
            rowGetter={({index}) => rows[index]}
            columns={columnDataAutosize}
            classes={classes}
            onRequestSort={handleRequestSort}
            {...props}
        />

    );
}

const ReactVirtualizedTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <ReactVirtualizedTable {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);

//ConsoleTableWithContext
export default withStyles(styles)(ReactVirtualizedTableWithContext);//ConsoleTable
