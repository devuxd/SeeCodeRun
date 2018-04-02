import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {Observable} from 'rxjs';
import {withStyles} from 'material-ui/styles';

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
import Highlighter from "react-highlight-words";


import JSAN from "jsan";
import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext} from "../containers/Pastebin";
import worker_script from '../workers/SortingWorker';
var myWorker = new Worker(worker_script);

const worker = Observable.fromEvent(myWorker, 'message');

worker.subscribe(function (e) {
  console.log(e.data);
});


const columnData = [
  {id: 'expression', numeric: false, className: 'cellPadding', label: 'Expression'},
  {id: 'value', numeric: false, className: 'cellPadding', label: 'Value'},
];

const createSortHandler = (props, property) => event => {
  props.onRequestSort(event, property);
};

const labelDisplayedRows = ({to, count}) => `${to} of ${count}`;

class TraceTableHead extends React.Component {
  render() {
    const {onSelectAllClick, order, orderBy, numSelected, rowCount, classes} = this.props;

    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected === rowCount}
              onChange={onSelectAllClick}
              padding="none"
            />
          </TableCell>
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

TraceTableHead.propTypes = {
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
  cellPadding: {
    paddingLeft: 'none',
    paddingRight: theme.spacing.unit,
  },
  bottomAction: {
    margin: theme.spacing.unit * 4
  },
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


  render() {
    const {classes} = this.props;
    return <PastebinContext.Consumer>{context => {
      const {
        data, objectNodeRenderer, order, orderBy, selected, rowsPerPage, page, highlightSingleText,
        handleSelectClick, handleSelectAllClick, handleRequestSort, isRowSelected, searchState
      } = context;

      const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
      if (this.searchState !== searchState) {
        this.searchState = searchState;
        this.findChuncks = configureMatchesFilter(searchState);
      }
      let matches = 0;
      return (
        <Paper className={classes.root}>
          <div className={classes.tableWrapper}>
            <Table className={classes.table}>
              <TraceTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={data.length}
                classes={classes}
              />
              <TableBody>
                {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {
                  const isSelected = isRowSelected(n.id);
                  const result = this.findChuncks(n);
                  if (!result.found) {
                    return null;
                  }
                  matches++;
                  return (
                    <TableRow
                      hover
                      onMouseEnter={() => highlightSingleText(n.loc)}
                      onMouseLeave={() => highlightSingleText()}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={-1}
                      key={n.id}
                      selected={isSelected}
                    >
                      <TableCell padding="checkbox" onClick={event => handleSelectClick(event, n.id)}>
                        <Checkbox checked={isSelected} padding={'none'}/>
                      </TableCell>
                      <TableCell className={classes.cellPadding}>
                        <Highlighter
                          searchWords={[searchState.value]}
                          textToHighlight={n.expression}
                          findChunks={() => result.expressions}
                        />
                      </TableCell>
                      <TableCell className={classes.cellPadding}>
                        <ObjectExplorer
                          expressionId={n.expressionId}
                          objectNodeRenderer={objectNodeRenderer}
                          data={_.isString(n.value) ? JSAN.parse(n.value) : n.value}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow style={{height: 49 * emptyRows}}>
                    <TableCell colSpan={3}/>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    colSpan={3}
                    count={data.length}
                    rowsPerPageOptions={[]}
                    rowsPerPage={matches}
                    page={rowsPerPage}
                    onChangePage={() => {
                    }}
                    onChangeRowsPerPage={() => {
                    }}
                    labelDisplayedRows={labelDisplayedRows}
                    Actions={() => <span className={classes.bottomAction}/>}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Paper>
      );
    }}</PastebinContext.Consumer>;
  }
}

TraceTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TraceTable);
