import React from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import {withStyles} from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import {fade, lighten, darken} from '@material-ui/core/styles/colorManipulator';

import Table from '@material-ui/core/Table';
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
import IconButton from '@material-ui/core/IconButton';
import VerticalAlignTopIcon from '@material-ui/icons/VerticalAlignTop';
import VerticalAlignBottomIcon from '@material-ui/icons/VerticalAlignBottom';
import Highlighter from "react-highlight-words";


import JSAN from "jsan";
import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext, TABLE_ROW_HEIGHT} from '../containers/Pastebin';
import {HighlightPalette} from '../containers/LiveExpressionStore';
import OverflowComponent from "./OverflowComponent";
import {configureGoToTimelineBranch} from '../containers/LiveExpressionStore';

const columnData = [
    {id: 'expression', numeric: false, className: 'cellPadding', label: 'Expression', colSpan: 1, showTimeflow: true},
    {id: 'value', numeric: false, className: 'cellPadding', label: 'Value', colSpan: 1, showTimeflow: false},
];

const createSortHandler = (props, property) => event => {
    props.onRequestSort(event, property);
};

class TraceTableHead extends React.Component {
    render() {
        const {
            classes,
            isSelectable, onSelectAllClick, order, orderBy, numSelected, rowCount,
            timeFlow, handleChangeTimeFlow
        } = this.props;

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
                                align={column.numeric?'right':'inherit'}
                                className={classes[column.className]}
                                sortDirection={orderBy === column.id ? order : false}
                            >
                                {column.showTimeflow && <Tooltip
                                    title={orderBy === 'time' ?
                                        (timeFlow === 'desc' ? 'Showing latest first' : 'Showing Oldest first')
                                        : 'Time flow'
                                    }
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

TraceTableHead.muiName = 'TableHead';

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
        height: TABLE_ROW_HEIGHT,
        '&$hover:hover': {
            backgroundColor: HighlightPalette.text,
        },
    },
    hoverObject: {
        backgroundColor: fade(HighlightPalette.object, 0.05),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.object,
        },
    },
    hoverGraphical: {
        backgroundColor: HighlightPalette.graphical,
        '&$hover:hover': {
            backgroundColor: fade(HighlightPalette.graphical, 0.2),
        }
    },
    hoverError: {
        backgroundColor: fade(HighlightPalette.error, 0.2),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    hover: {},
    expressionCellRoot: {
        borderBottom: 0,
        overflow: 'hidden',
        display: 'table-cell',
        verticalAlign: 'inherit',
        textAlign: 'left',
        padding: 0,
        paddingLeft: theme.spacing(2),
        maxWidth: expressionCellMaxWidth,
    },
    expressionCellContent: {
        overflow: 'auto',
        position: 'relative',
        maxWidth: expressionCellMaxWidth,
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(1),
        marginBottom: theme.spacing(-1),
    },
    expressionCellContentTypography: {
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontWeight: 'normal',
        fontSize: 11,
        // lineHeight: 14,
        letterSpacing: 0,
    },
    valueCell: {
        borderBottom: 0,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        '&:first-child': {
            paddingLeft: theme.spacing(2),
        },
        '&:last-child': {
            paddingRight: theme.spacing(2),
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
        margin: theme.spacing(4),
    },
    timeFlowButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        //marginLeft: -theme.spacing.unit * 3,
        // marginRight: theme.spacing.unit * 2,
    },
    tableHeadRow: {
        height: TABLE_ROW_HEIGHT + 16,
    },
    tableHeadCell: {
        marginLeft: theme.spacing(35),
    },
    cellPadding: {
        paddingLeft: theme.spacing(6),
    }
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

            const hasFilters = searchState.isFunctions || searchState.isExpressions || searchState.isValues;

            const isAnyText = !searchState.value.trim().length;

            if (isAnyText && !hasFilters) {
                result.found = true;
                return result;
            }

            if (searchState.isFunctions &&
                searchState.functionLikeExpressions.includes(data.entry.expressionType)) {
                result.functions = isAnyText ? [] : findChunks(data.expression);
                result.found = isAnyText || !!result.functions.length;
            }

            if (searchState.isExpressions &&
                !searchState.functionLikeExpressions.includes(data.entry.expressionType)) {
                result.expressions = isAnyText ? [] : findChunks(data.expression);
                result.found = isAnyText || result.found || !!result.expressions.length;
            }

            if (searchState.isValues &&
                !searchState.functionLikeExpressions.includes(data.entry.expressionType)) {
                result.values = isAnyText ? [] : findChunks(data.value);
                result.found = isAnyText || result.found || !!result.values.length;
            }
            return result;
        }
    }
;

class TraceTable extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
        this.parsed = {};
        this.isHovered = false;
    }

    actionsComponent = (classes) => {
        this.actions = this.actions || (() => <span className={classes.bottomAction}/>);
        return this.actions;
    };

    labelDisplayedRows = ({to, count}) =>
        count ? (to === count) ? 'End of results' : 'Scroll for more results' : 'No results';

    render() {

        const {
            classes,
            data, objectNodeRenderer, order, orderBy, selected, rowsPerPage, page, isSelectable,
            handleSelectClick, handleSelectAllClick, handleRequestSort, isRowSelected, searchState,
            HighlightTypes, highlightSingleText, highlightErrors,
            setCursorToLocation, traceSubscriber, handleChangePlaying,
            timeFlow, handleChangeTimeFlow, isNew, defaultRowsPerPage, /*scrollToTop,*/
        } = this.props;

        if (isNew) {
            this.parsed = {};
        }

        if (this.searchState !== searchState) {
            this.searchState = searchState;
            this.findChunks = configureMatchesFilter(searchState);
        }

        this.totalMatches = 0;
        let matchedData = data.map(n => {
            const newN = {...n, isMatch: true, chunksResult: this.findChunks(n)};
            if (!newN.chunksResult.found || !newN.expression) {
                newN.isMatch = false;
            }
            if (n.isError) {
                newN.isMatch = true;
            }
            return newN;
        });
        matchedData = matchedData.filter(n => n.isMatch);
        this.totalMatches = matchedData.length;
        highlightErrors && highlightErrors();
        // console.log('table', this.totalMatches, data.length);

        const goToTimelineBranch = configureGoToTimelineBranch();

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
                        <TableBody onMouseEnter={() => {
                            this.isHovered = true;
                            handleChangePlaying('table', false);
                        }}
                                   onMouseLeave={() => {
                                       this.isHovered = false;
                                       handleChangePlaying('table', true);
                                   }}>
                            {matchedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {
                                const isSelected = isRowSelected(n.id);
                                const result = n.chunksResult;
                                this.parsed[n.id] =
                                    this.parsed[n.id] || {
                                        current: (isString(n.value) ?
                                            JSAN.parse(n.value) : n.value)
                                    };

                                const parsed = this.parsed[n.id].current;
                                n.isError && highlightErrors && highlightErrors([n.loc], [], false, true);
                                return (
                                    <TableRow
                                        hover
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        tabIndex={-1}
                                        key={n.id}
                                        selected={isSelected}
                                        classes={{
                                            root: classes.tableRow,
                                            //  hover: classes.hover
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
                                            onMouseEnter={() =>
                                                highlightSingleText(n.loc, HighlightTypes.text)}
                                            onMouseLeave={() => highlightSingleText()}
                                        >
                                            <OverflowComponent
                                                contentClassName={classes.expressionCellContent}
                                                disableOverflowDetectionY={true}
                                            >
                                                <ButtonBase onClick={
                                                    () => {
                                                        setCursorToLocation(n.loc);
                                                        goToTimelineBranch(n.entry);
                                                    }
                                                }>
                                                    <Typography align={"left"}
                                                                className={classes.expressionCellContentTypography}
                                                                noWrap>
                                                        <Highlighter
                                                            searchWords={[searchState.value]}
                                                            textToHighlight={n.expression}
                                                            findChunks={() => result.expressions}
                                                        />
                                                    </Typography>
                                                </ButtonBase>
                                            </OverflowComponent>
                                        </TableCell>
                                        <TableCell className={classes.valueCell}
                                                   onMouseEnter={() =>
                                                       highlightSingleText(
                                                           n.loc, n.isError ? HighlightTypes.error
                                                               : n.isGraphical ?
                                                                   HighlightTypes.graphical : HighlightTypes.text,
                                                           traceSubscriber.getMatches(n.funcRefId, n.dataRefId, n.entry.calleeId))}
                                                   onMouseLeave={() => highlightSingleText()}
                                                   classes={{
                                                       root: n.isError ? classes.hoverError
                                                           : n.isGraphical ? classes.hoverGraphical : classes.hoverObject,
                                                       // hover: classes.hover
                                                   }}
                                        >
                                            <ObjectExplorer
                                                expressionId={n.expressionId}
                                                objectNodeRenderer={objectNodeRenderer}
                                                data={parsed}
                                                outputRefs={n.entry.outputRefs}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {((defaultRowsPerPage - 4) - this.totalMatches) > 0 && (
                                <TableRow style={{
                                    height:
                                        TABLE_ROW_HEIGHT * ((defaultRowsPerPage - 4) - this.totalMatches)
                                }}>
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
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onChangePage={() => {
                                    }}
                                    onChangeRowsPerPage={() => {
                                    }}
                                    labelDisplayedRows={this.labelDisplayedRows}
                                    ActionsComponent={this.actionsComponent(classes)}
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
        const {handleTotalChange, scrollToTop} = this.props;
        if (handleTotalChange && this.traceTotal !== this.totalMatches) {
            this.traceTotal = this.totalMatches;
            handleTotalChange(this.traceTotal);
        }
        if (!this.isHovered && scrollToTop) {
            scrollToTop();
        }
    }

    componentWillUnmount() {
        this.parsed = {};
    }
}

TraceTable.propTypes = {
    classes: PropTypes.object.isRequired,
    page: PropTypes.number,
};

TraceTable.defaultProps = {
    page: 0,
};

const TraceTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <TraceTable {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(TraceTableWithContext);
