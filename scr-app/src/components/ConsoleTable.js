import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from 'material-ui/styles';
import {fade, lighten, darken} from 'material-ui/styles/colorManipulator';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import Table, {
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
} from 'material-ui/Table';

import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import Tooltip from 'material-ui/Tooltip';
// import Highlighter from "react-highlight-words";


import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext} from "../containers/Pastebin";
import {HighlightPalette} from '../containers/LiveExpressionStore';

const columnData = [
    {id: 'value', numeric: false, className: 'cellPadding', label: ''/*'Value'*/, colSpan: 1},
];

const createSortHandler = (props, property) => event => {
    props.onRequestSort(event, property);
};


class ConsoleTableHead extends React.Component {
    render() {
        const {isSelectable, onSelectAllClick, order, orderBy, numSelected, rowCount, classes} = this.props;

        return (
            <TableHead>
                <TableRow>
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
                                numeric={column.numeric}
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
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    tableRow: {
        '&$hover:hover': {
            backgroundColor: HighlightPalette.text,
        },
    },
    tableRowError: {
        backgroundColor: fade(HighlightPalette.error, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        backgroundColor: fade(HighlightPalette.graphical, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.graphical,
        }
    },
    hover: {},
    valueCell: {
        borderBottom: 0,
        paddingLeft: theme.spacing.unit,
        '&:first-child': {
            paddingLeft: theme.spacing.unit * 4,
        },
        '&:last-child': {
            paddingRight: theme.spacing.unit * 2,
        },
        overflow: 'hidden',
        margin: 0,
        paddingTop: 0,
        paddingBottom: 0,
    },
    bottomAction: {
        margin: theme.spacing.unit * 4
    },
    cellParamContainer: {
        //display: 'box',
        // display: 'inline-block',
        position: 'relative',
        // flexDirection: 'row',
        // flexWrap: 'wrap',
        // overflowX: 'auto',
        // padding: theme.spacing.unit,
        // paddingBottom: theme.spacing.unit,
    },
    cellParam: {
        display: 'inline-flex',
        marginLeft: theme.spacing.unit,
    },
    iconContainer: {
        position: 'absolute',
        left: 0,
        marginLeft: -theme.spacing.unit * 3,
        top: 0,
    },
    icon: {
        fontSize: theme.spacing.unit * 2,
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
    }
});

const configureMatchesFilter = (searchState) => {
        const findChuncks = (textToHighlight) => {
            const searchWords = searchState.value.split(' ');
            return searchState.findChuncks({searchWords, textToHighlight})
        };

        return (data) => {
            const result = {
                found: false,
                functions: [],
                expressions: [],
                values: [],
            };

            const hasFilters = searchState.isFunctions || searchState.isExpressions || searchState.isValues;

            const isAnyText = !searchState.value.trim().length;

            if (isAnyText && !hasFilters) {
                result.found = true;
                return result;
            }

            if (searchState.isFunctions &&
                searchState.functionLikeExpressions.includes(data.expressionType)) {
                result.functions = isAnyText ? [] : findChuncks(data.expression);
                result.found = isAnyText || !!result.functions.length;
            }

            if (searchState.isExpressions &&
                !searchState.functionLikeExpressions.includes(data.expressionType)) {
                result.expressions = isAnyText ? [] : findChuncks(data.expression);
                result.found = isAnyText || result.found || !!result.expressions.length;
            }

            if (searchState.isValues &&
                !searchState.functionLikeExpressions.includes(data.expressionType)) {
                result.values = isAnyText ? [] : findChuncks(data.value);
                result.found = isAnyText || result.found || !!result.values.length;
            }
            // console.log(result);
            return result;
        }
    }
;

class ConsoleTable extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
    }

    labelDisplayedRows = ({to, count}) => count ? (to === count) ? 'End of results' : 'Scroll for more results' : 'No results';

    render() {

        const {
            classes,
            logData, objectNodeRenderer, order, orderBy, selected, rowsPerPage, page, isSelectable,
            handleSelectClick, handleSelectAllClick, handleRequestSort, isRowSelected, searchState,
            HighlightTypes, highlightSingleText, setCursorToLocation, traceSubscriber, handleChangePlaying
        } = this.props;


        if (this.searchState !== searchState) {
            this.searchState = searchState;
            this.findChuncks = configureMatchesFilter(searchState);
        }
        this.totalMatches = 0;
        this.matches = 0;
        // console.log('table');
        const data = logData;
        const matchedData = data.map(n => {
            const newN = {...n, isMatch: true, chunksResult: this.findChuncks(n)};
            if (!newN.chunksResult.found || (!newN.isFromInput && !newN.expression)) {
                newN.isMatch = false;
            } else {
                this.totalMatches++;
            }
            return newN;
        });
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, matchedData.length - page * rowsPerPage);
        return (
            <Paper className={classes.root}>
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
                            {matchedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {
                                const isSelected = isRowSelected(n.id);
                                // const result = n.chunksResult;
                                if (!n.isFromInput && !n.isMatch) {
                                    return null;
                                }
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
                                this.matches++;

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
                                            : n.isGraphical ? classes.tableRowGraphical : n.isFromInput ? null : classes.tableRow,
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
                                <TableRow style={{height: 49 * emptyRows}}>
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
                                    rowsPerPage={this.matches}
                                    page={page}
                                    onChangePage={() => {
                                    }}
                                    onChangeRowsPerPage={() => {
                                    }}
                                    labelDisplayedRows={this.labelDisplayedRows}
                                    Actions={() => <span className={classes.bottomAction}/>}
                                    className={classes.bottomValueCell}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </Paper>
        );
    }

    componentDidMount() {
        const {index, ScrollingListContainers} = this.props;
        if (ScrollingListContainers) {
            ScrollingListContainers[index] = this.containerRef;
        }
    }

    componentDidUpdate() {
        const {handleTotalChange} = this.props;
        if (handleTotalChange && this.consoleTotal !== this.totalMatches) {
            this.consoleTotal = this.totalMatches;
            handleTotalChange(this.consoleTotal);
        }
    }
}

ConsoleTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

const ConsoleTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <ConsoleTable {...context} {...props} />
        }}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(ConsoleTableWithContext);//ConsoleTable
