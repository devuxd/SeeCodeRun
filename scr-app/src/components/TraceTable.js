import React from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import {withStyles} from 'material-ui/styles';
import ButtonBase from 'material-ui/ButtonBase';
import Typography from 'material-ui/Typography';
import {fade, lighten, darken} from 'material-ui/styles/colorManipulator';

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
import IconButton from 'material-ui/IconButton';
import VerticalAlignTopIcon from '@material-ui/icons/VerticalAlignTop';
import VerticalAlignBottomIcon from '@material-ui/icons/VerticalAlignBottom';
import Highlighter from "react-highlight-words";


import JSAN from "jsan";
import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext} from "../containers/Pastebin";
import {HighlightPalette} from '../containers/LiveExpressionStore';
import OverflowComponent from "./OverflowComponent";

const columnData = [
    {id: 'expression', numeric: false, className: 'cellPadding', label: 'Expression', colSpan: 1, showTimeflow: true},
    {id: 'value', numeric: false, className: 'cellPadding', label: 'Value', colSpan: 1},
];

const createSortHandler = (props, property) => event => {
    props.onRequestSort(event, property);
};

// const labelDisplayedRows = ({to, count}) => `${to} of ${count}`;

class TraceTableHead extends React.Component {
    render() {
        const {
            classes,
            isSelectable, onSelectAllClick, order, orderBy, numSelected, rowCount,
            timeFlow, handleChangeTimeFlow
        } = this.props;

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
                                // colSpan={column.colSpan}
                            >
                                {column.showTimeflow && <Tooltip
                                    title={orderBy === 'time' ? (timeFlow === 'desc' ? 'Showing latest first' : 'Showing Oldest first') : 'Time flow'}
                                    placement={'bottom-end'}
                                    enterDelay={300}
                                >
                                    <IconButton color={orderBy === 'time' ? 'secondary' : 'default'}
                                                onClick={handleChangeTimeFlow} className={classes.timeFlowButton}>
                                        {timeFlow === 'desc' ? <VerticalAlignTopIcon/> : <VerticalAlignBottomIcon/>}
                                    </IconButton>
                                </Tooltip>}
                                <Tooltip
                                    title="Sort"
                                    placement={column.numeric ? 'bottom-end' : 'bottom-start'}
                                    enterDelay={300}
                                >
                                    <TableSortLabel
                                        active={orderBy === column.id}
                                        direction={order}
                                        onClick={createSortHandler(this.props, column.id)}
                                        className={column.showTimeflow ? null : classes.tableHeadCell}
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

TraceTableHead.propTypes = {
    isSelectable: PropTypes.bool.isRequired,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

let expressionCellMaxWidth = 300;

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
        // width: '100%',
        height: '100%',
    },
    tableRow: {
        '&$hover:hover': {
            backgroundColor: HighlightPalette.text,
        },
    },
    tableRowError: {
        backgroundColor: fade(HighlightPalette.error, 0.2),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        backgroundColor: fade(HighlightPalette.graphical, 0.2),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.graphical,
        }
    },
    hover: {},
    expressionCellRoot: {
        borderBottom: 0,
        overflow: 'hidden',
        display: 'table-cell',
        verticalAlign: 'inherit',
        // Workaround for a rendering bug with spanned columns in Chrome 62.0.
        // Removes the alpha (sets it to 1), and lightens or darkens the theme color.
        // borderBottom: `1px solid ${
        //     theme.palette.type === 'light'
        //         ? lighten(fade(theme.palette.divider, 1), 0.88)
        //         : darken(fade(theme.palette.divider, 1), 0.8)
        //     }`,
        textAlign: 'left',
        padding: 0,
        paddingLeft: theme.spacing.unit * 2,
        paddingRight: 0,
    },
    expressionCellContent: {
        overflow: 'auto',
        position: 'relative',
        maxWidth: expressionCellMaxWidth,
        paddingTop: theme.spacing.unit,
        paddingBottom: theme.spacing.unit * 2,
        marginBottom: -theme.spacing.unit,
    },
    valueCell: {
        borderBottom: 0,
        paddingLeft: theme.spacing.unit,
        paddingRight: theme.spacing.unit,
        '&:last-child': {
            paddingRight: theme.spacing.unit * 2,
        },
    },
    bottomValueCell: {
        borderTop: `1px solid ${
            theme.palette.type === 'light'
                ? lighten(fade(theme.palette.divider, 1), 0.88)
                : darken(fade(theme.palette.divider, 1), 0.8)
            }`,
    },
    bottomAction: {
        margin: theme.spacing.unit * 4
    },
    timeFlowButton: {
        marginLeft: -theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 2,
    },
    tableHeadCell: {
        marginLeft: theme.spacing.unit * 5,
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

class TraceTable extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
    }

    labelDisplayedRows = ({to, count}) => count ? (to === count) ? 'End of results' : 'Scroll for more results' : 'No results';

    render() {

        const {
            classes,
            data, objectNodeRenderer, order, orderBy, selected, rowsPerPage, page, isSelectable,
            handleSelectClick, handleSelectAllClick, handleRequestSort, isRowSelected, searchState,
            HighlightTypes, highlightSingleText, setCursorToLocation, traceSubscriber, handleChangePlaying,
            timeFlow, handleChangeTimeFlow
        } = this.props;


        if (this.searchState !== searchState) {
            this.searchState = searchState;
            this.findChuncks = configureMatchesFilter(searchState);
        }
        this.totalMatches = 0;
        this.matches = 0;
        // console.log('table');

        const matchedData = data.map(n => {
            const newN = {...n, isMatch: true, chunksResult: this.findChuncks(n)};
            if (!newN.chunksResult.found || !newN.expression) {
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
                        <TraceTableHead
                            isSelectable={isSelectable}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={data.length}
                            classes={classes}
                            timeFlow={timeFlow}
                            handleChangeTimeFlow={handleChangeTimeFlow}
                        />
                        <TableBody onMouseEnter={() => handleChangePlaying('table', false)}
                                   onMouseLeave={() => handleChangePlaying('table', true)}>
                            {matchedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {
                                const isSelected = isRowSelected(n.id);
                                const result = n.chunksResult;
                                if (!n.isMatch) {
                                    return null;
                                }
                                this.matches++;

                                return (
                                    <TableRow
                                        hover
                                        onMouseEnter={() =>
                                            highlightSingleText(
                                                n.loc, n.isError ? HighlightTypes.error
                                                    : n.isGraphical ?
                                                        HighlightTypes.graphical : HighlightTypes.text,
                                                traceSubscriber.getMatches(n.funcRefId, n.dataRefId))}
                                        onMouseLeave={() => highlightSingleText()}
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        tabIndex={-1}
                                        key={n.id}
                                        selected={isSelected}
                                        classes={{
                                            root: n.isError ? classes.tableRowError
                                                : n.isGraphical ? classes.tableRowGraphical : classes.tableRow,
                                            hover: classes.hover
                                        }}
                                    >
                                        {isSelectable &&
                                        <TableCell padding="checkbox"
                                                   onClick={event => handleSelectClick(event, n.id)}>
                                            <Checkbox checked={isSelected} padding={'none'}/>
                                        </TableCell>
                                        }
                                        <TableCell
                                            classes={{root: classes.expressionCellRoot}}
                                        >
                                            <OverflowComponent
                                                contentClassName={classes.expressionCellContent}
                                                disableOverflowDetectionY={true}
                                                //  placeholder={<Typography>Yo</Typography>}
                                                //  placeholderClassName={classes.expressionCellContent}
                                                // placeholderDisableGutters={true}
                                            >
                                                <ButtonBase onClick={() => setCursorToLocation(n.loc)}>
                                                    <Typography align={"left"} noWrap>
                                                        <Highlighter
                                                            searchWords={[searchState.value]}
                                                            textToHighlight={n.expression}
                                                            findChunks={() => result.expressions}
                                                        />
                                                    </Typography>
                                                </ButtonBase>
                                            </OverflowComponent>
                                        </TableCell>
                                        <TableCell className={classes.valueCell}>
                                            <ObjectExplorer
                                                expressionId={n.expressionId}
                                                objectNodeRenderer={objectNodeRenderer}
                                                data={isString(n.value) ? JSAN.parse(n.value) : n.value}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {emptyRows > 0 && (
                                <TableRow style={{height: 49 * emptyRows}}>
                                    <TableCell colSpan={isSelectable ? 3 : 2}/>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    colSpan={isSelectable ? 3 : 2}
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
        if (handleTotalChange && this.traceTotal !== this.totalMatches) {
            this.traceTotal = this.totalMatches;
            handleTotalChange(this.traceTotal);
        }
    }
}

TraceTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

const TraceTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <TraceTable {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(TraceTableWithContext);
