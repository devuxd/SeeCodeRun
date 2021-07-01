import {number, text, withKnobs} from '@storybook/addon-knobs';
import React, {
   forwardRef,
   useMemo,
} from 'react';

import Inspector from 'react-inspector';
import {withStyles} from '@material-ui/styles';

import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

import InfiniteStickyList from '../components/InfiniteStickyList';
import {StickyAction} from '../components/StickyAction';

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

const DefaultRow = ({index, style, data}) => {
   const inspector = <Inspector
      data={{height: data.itemSize(index), ...data.items[index], ...style}}/>;
   return <Row>{inspector}</Row>;
};


const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

export const InfiniteStickyListWithInspector = () => {
   const defaultItems = new Array(number('Default items size', 200))
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
   
   return (<div style={{
      height: number('Container Height', 800),
      width: text('Container Width', '100%')
   }}>
      <StyledInfiniteStickyList {...defaultProps}/>
   </div>)
};

export default {
   title: 'InfiniteStickyList',
   component: InfiniteStickyList,
   decorators: [ withKnobs ],
}
