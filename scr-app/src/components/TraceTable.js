import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _ from 'lodash';
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
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import IconButton from 'material-ui/IconButton';
import Tooltip from 'material-ui/Tooltip';
import FirstPageIcon from 'material-ui-icons/FirstPage';
import KeyboardArrowLeft from 'material-ui-icons/KeyboardArrowLeft';
import KeyboardArrowRight from 'material-ui-icons/KeyboardArrowRight';
import LastPageIcon from 'material-ui-icons/LastPage';
import PlayArrowIcon from 'material-ui-icons/PlayArrow';
import PauseIcon from 'material-ui-icons/Pause';
import SearchIcon from 'material-ui-icons/Search';
import DeleteIcon from 'material-ui-icons/Delete';
import CallMergeIcon from 'material-ui-icons/CallMerge';
import CallSplitIcon from 'material-ui-icons/CallSplit';
import FilterListIcon from 'material-ui-icons/FilterList';
import {lighten} from 'material-ui/styles/colorManipulator';
import {InputAdornment, TextField} from "material-ui";
import JSAN from "jsan";
import ObjectExplorer from "./ObjectExplorer";

const columnData = [
  {id: 'time', numeric: true, disablePadding: false, label: 'Time'},
  {id: 'expression', numeric: false, disablePadding: true, label: 'Expression'},
  {id: 'value', numeric: false, disablePadding: true, label: 'Value'},

];

class TraceTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property);
  };

  render() {
    const {onSelectAllClick, order, orderBy, numSelected, rowCount} = this.props;

    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
          {columnData.map(column => {
            return (
              <TableCell
                key={column.id}
                numeric={column.numeric}
                padding={column.disablePadding ? 'none' : 'default'}
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
                    onClick={this.createSortHandler(column.id)}
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


const InputEndAdornment = (props) => {
  return (
    <InputAdornment position="end">
      <IconButton
        aria-label="Toggle password visibility"
        // onClick={}
        // onMouseDown={}
      >
        aA
      </IconButton>
    </InputAdornment>
  )
};

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
  },
  highlight:
    theme.palette.type === 'light'
      ? {
        color: theme.palette.secondary.main,
        backgroundColor: lighten(theme.palette.secondary.light, 0.85),
      }
      : {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark,
      },
  spacer: {
    flex: '1 0 5%',
  },
  actions: {
    color: theme.palette.text.secondary,
    flex: '1 0 auto',
  },
  title: {
    flex: '1 1 95%',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
});

let TraceTableToolbar = props => {
  const {numSelected, classes} = props;

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subheading">
            {numSelected} selected
          </Typography>
        ) : (
          <TextField
            id="search"
            label={<SearchIcon/>}
            type="search"
            className={classes.textField}
            margin="normal"
            fullWidth
            InputProps={{
              endAdornment: <InputEndAdornment {...props} />
            }}
          />
        )}
      </div>
      <div className={classes.spacer}/>
      <div className={classes.actions}>
        {numSelected > 0 ? (
          <span>
            <Tooltip title="Merge results">
              <IconButton aria-label="Merge results">
                <CallMergeIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title="Branch results">
              <IconButton aria-label="Branch results">
                <CallSplitIcon/>
              </IconButton>
            </Tooltip>
          </span>
        ) : (
          <Tooltip title="Filter list">
            <IconButton aria-label="Filter list">
              <FilterListIcon/>
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  );
};

TraceTableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
};

TraceTableToolbar = withStyles(toolbarStyles)(TraceTableToolbar);

const actionsStyles = theme => ({
  root: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing.unit * 2.5,
  },
});

class TablePaginationActions extends React.Component {
  handleFirstPageButtonClick = event => {
    this.props.onChangePage(event, 0);
  };

  handleBackButtonClick = event => {
    this.props.onChangePage(event, this.props.page - 1);
  };

  handleNextButtonClick = event => {
    this.props.onChangePage(event, this.props.page + 1);
  };

  handleLastPageButtonClick = event => {
    this.props.onChangePage(
      event,
      Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1),
    );
  };

  render() {
    const {classes, count, page, rowsPerPage, theme} = this.props;

    return (
      <div className={classes.root}>
        <IconButton
          onClick={this.handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="First Page"
        >
          {theme.direction === 'rtl' ? <LastPageIcon/> : <FirstPageIcon/>}
        </IconButton>
        <IconButton
          onClick={this.handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous Page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowRight/> : <KeyboardArrowLeft/>}
        </IconButton>
        <IconButton
          onClick={this.handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Next Page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowLeft/> : <KeyboardArrowRight/>}
        </IconButton>
        <IconButton
          onClick={this.handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Last Page"
        >
          {theme.direction === 'rtl' ? <FirstPageIcon/> : <LastPageIcon/>}
        </IconButton>
      </div>
    );
  }
}

TablePaginationActions.propTypes = {
  classes: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired,
};

const TablePaginationActionsWrapped = withStyles(actionsStyles, {withTheme: true})(
  TablePaginationActions,
);


const styles = theme => ({
  root: {
    width: '100%',
    height: '100%',
    // marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 800,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
});

class TraceTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      order: 'desc',
      orderBy: 'time',
      selected: [],
      data: [],
      page: 0,
      rowsPerPage: 5,
      theme: null,
      highlightSingleText: () => {
      },
      getEditorTextInLoc: () => {
        return '';
      },
      colorizeDomElement: () => {
      },
    }
    ;
  }

  handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = 'desc';
    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc';
    }
    const data = this.sortData(this.state.data, orderBy, order);
    this.setState({data, order, orderBy});
  };

  sortData = (data, orderBy, order) => {
    return order === 'desc' ?
      data.sort((a, b) => (b[orderBy] < a[orderBy] ? -1 : 1))
      : data.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1));
  };

  handleSelectAllClick = (event, checked) => {
    if (checked) {
      this.setState({selected: this.state.data.map(n => n.id)});
      return;
    }
    this.setState({selected: []});
  };

  handleClick = (event, id) => {
    const {selected} = this.state;
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    this.setState({selected: newSelected});
  };

  handleChangePage = (event, page) => {
    this.setState({page});
  };

  handleChangeRowsPerPage = event => {
    this.setState({rowsPerPage: event.target.value});
  };

  isSelected = id => this.state.selected.indexOf(id) !== -1;

  render() {
    const {classes} = this.props;
    const {
      data, order, orderBy, selected, rowsPerPage, page,
      theme, highlightSingleText, objectNodeRenderer,
    } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

    return (
      <Paper className={classes.root}>
        <TraceTableToolbar numSelected={selected.length}/>
        <div className={classes.tableWrapper}>
          <Table className={classes.table}>
            <TraceTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={this.handleSelectAllClick}
              onRequestSort={this.handleRequestSort}
              rowCount={data.length}
            />
            <TableBody>
              {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {
                const isSelected = this.isSelected(n.id);
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
                    <TableCell padding="checkbox" onClick={event => this.handleClick(event, n.id)}>
                      <Checkbox checked={isSelected}/>
                    </TableCell>
                    <TableCell numeric>{n.time}</TableCell>
                    <TableCell padding="none">
                      {
                        n.expression
                      }
                    </TableCell>
                    <TableCell padding="none">
                      <ObjectExplorer
                        objectNodeRenderer={objectNodeRenderer}
                        theme={theme}
                        data={_.isString(n.value) ? JSAN.parse(n.value) : n.value}/>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{height: 49 * emptyRows}}>
                  <TableCell colSpan={6}/>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  colSpan={6}
                  count={data.length}
                  rowsPerPageOptions={[1, 5, 10, 25, 50]}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  backIconButtonProps={{
                    'aria-label': 'Previous Page',
                  }}
                  nextIconButtonProps={{
                    'aria-label': 'Next Page',
                  }}
                  onChangePage={this.handleChangePage}
                  onChangeRowsPerPage={this.handleChangeRowsPerPage}
                  Actions={TablePaginationActionsWrapped}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Paper>
    );
  }

  componentDidMount() {
    const {setLiveExpressionStoreChange} = this.props;
    setLiveExpressionStoreChange(this.liveExpressionStoreChange);
  }

  liveExpressionStoreChange = (timeline, theme, highlightSingleText, getEditorTextInLoc, colorizeDomElement, objectNodeRenderer) => {
    const {orderBy, order} = this.state;
    const data = (timeline || []).map((entry, i) => ({
      id: i, // todo entry.timestamp
      time: i,
      expression: getEditorTextInLoc(entry.loc),
      value: entry.data,
      loc: {...entry.loc},
    }));

    const sortedData = this.sortData(data, orderBy, order);

    this.setState({
      timeline: timeline,
      data: sortedData,
      theme: theme,
      highlightSingleText: highlightSingleText,
      getEditorTextInLoc: getEditorTextInLoc,
      colorizeDomElement: colorizeDomElement,
      objectNodeRenderer: objectNodeRenderer,
    });
  };
}

TraceTable.propTypes = {
  classes: PropTypes.object.isRequired,
  setLiveExpressionStoreChange: PropTypes.func.isRequired,
};

export default withStyles(styles)(TraceTable);
