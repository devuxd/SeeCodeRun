import {
   forwardRef,
   useMemo,
} from 'react';
import {
   StyledEngineProvider,
   ThemeProvider,
   CssBaseline,
} from '@mui/material';

import {
   createTheme,
} from '@mui/material/styles';

import Inspector from 'react-inspector';
import {withStyles} from '@mui/styles';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import InfiniteStickyList from '../components/InfiniteStickyList';
import {StickyAction} from '../components/StickyAction';

const muiTheme = createTheme({
   spacingUnit: x => x * 8,
   // palette:{},
});

const RowContainer = forwardRef(
   (
      {
         isSticky, classes, children,
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

const Row = withStyles(theme => ({
   rowContainer: {
      backgroundColor: theme.palette.common.white,
      display: 'flex',
      alignItems: 'center',
      flexFlow: 'row',
   },
   expressionCellContent: {
      overflow: 'auto',
      '&::-webkit-scrollbar': {
         display: 'none' /* Hide scrollbar for IE, Edge and Firefox */
      },
      msOverflowStyle: 'none',  /* IE and Edge */
      scrollbarWidth: 'none',  /* Firefox */
      borderBottom: 0,
      display: 'table-cell',
      verticalAlign: 'inherit',
      textAlign: 'left',
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 8,
      paddingRight: 8,
      minHeight: 22,
   },
}))(({classes, children}) => {
   const tableClasses = useMemo(
      () => ({root: classes.expressionCellContent}
      ), [classes]);
   return (
      <TableCell
         component="div"
         classes={tableClasses}
      >
         {children}
      </TableCell>
   );
});

const styles = theme => ({
   row: {},
   sticky: {
      backgroundColor: theme.palette.background.default,
      position: 'sticky !important',
      zIndex: 1,
   },
});

const DefaultRow = ({index, data}) => {
   const inspector = <Inspector
      data={data.items[index]}/>;
   return <Row>{inspector}</Row>;
};


const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

export const InfiniteStickyListWithInspector = (
   {
      height = 800,
      widthPercentage = 100,
      itemsSize = 200,
   }
) => {
   const defaultItems = new Array(itemsSize)
      .fill(true)
      .map((rowHeight, i) => ({
         label: `(${i})`,
         i,
         isActive: false
      }));
   
   const defaultIsItemLoaded = index => !!defaultItems[index];
   const defaultLoadMoreItems = (startIndex, stopIndex) => {
      for (let index = startIndex; index <= stopIndex; index++) {
         defaultItems[index] = {loading: true};
      }
      return new Promise(resolve =>
         setTimeout(() => {
            for (let index = startIndex; index <= stopIndex; index++) {
               defaultItems[index] = {
                  label: `(${index})`,
                  index,
                  isActive: false
               };
            }
            resolve();
         }, 10)
      );
   };
   
   const defaultProps = {
      items: defaultItems,
      estimatedItemSize: 22,
      StickyComponent: StickyAction,
      RowComponent: DefaultRow,
      RowContainer,
      isItemLoaded: defaultIsItemLoaded,
      loadMoreItems: defaultLoadMoreItems,
      heightDelta: 0,
   };
   
   return (
      <StyledEngineProvider injectFirst>
         <ThemeProvider theme={muiTheme}>
            <CssBaseline/>
            <div style={{
               height,
               width: `${widthPercentage}%`,
            }}>
               <StyledInfiniteStickyList {...defaultProps}/>
            </div>
         </ThemeProvider>
      </StyledEngineProvider>
   )
};

export default {
   title: 'InfiniteStickyList',
   component: InfiniteStickyListWithInspector,
   args: {
      height: 800,
      widthPercentage: 100,
      itemsSize: 200,
   },
   argTypes: {
      height: {
         control: {
            type: 'range', min: 400, max: 1200, step: 50,
         },
      },
      widthPercentage: {
         control: {
            type: 'range', min: 0, max: 100, step: 1,
         },
      },
      itemsSize: {
         control: {
            type: 'range', min: 0, max: 999999, step: 10,
         },
      },
   },
}
