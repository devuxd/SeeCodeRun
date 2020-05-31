import React, {
    createContext,
    forwardRef,
    useState,
    memo,
    useRef,
    useEffect
} from "react";
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import memoize from "memoize-one";
import update from "immutability-helper";
import AutoSizer from "react-virtualized-auto-sizer";
import useResizeObserver from "use-resize-observer/polyfilled";
import {VariableSizeList as List, areEqual} from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import {withStyles} from '@material-ui/core/styles';
import Inspector from "react-inspector";

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

const createItemData = memoize(props => ({...props}));

const ItemWrapper = ({data, index, style, ...other}) => {
    const {ItemRenderer, stickyIndices} = data;
    if (index === 0) {
        if (stickyIndices.length) {
            return (
                <ItemRenderer index={index} style={style} data={data} {...other} />
            );
        } else {
            return null;
        }
    }
    if (stickyIndices && stickyIndices.includes(index)) {
        return null;
    }
    return <ItemRenderer index={index} style={style} data={data} {...other} />;
};

const RowWrapper = memo(({index, style, isScrolling, data, ...other}) => {
    const {
        // itemSize,
        StickyComponent,
        RowComponent,
        stickyIndices,
        handleStickyIndex,
        onItemResize,
        classes,
    } = data;

    const isSticky = stickyIndices.includes(index);
    const {ref} = useResizeObserver({
        onResize: ({width, height}) => {
            onItemResize(index, height, width, isScrolling);
        },
        //  onPosition: () => onItemResize(index, itemSize(index))
    });

    return (
        <div className={isSticky ? classes.sticky : classes.row} style={style}>
            <div ref={ref}>
                <StickyComponent
                    isSticky={isSticky}
                    onStickyChange={() => handleStickyIndex(index)}
                />
                <RowComponent index={index} style={style} data={data} {...other}/>
            </div>
        </div>
    );
}, areEqual);

const innerElementType = forwardRef(({children, ...rest}, ref) => (
    <StickyListContext.Consumer>
        {({stickyIndices, itemSize, ...otherData}) => {
            let currentTop = 0;
            return (
                <div ref={ref} {...rest}>
                    {stickyIndices.map((index, i) => (
                        <RowWrapper
                            data={{
                                itemSize,
                                stickyIndices,
                                ...otherData
                            }}
                            index={index}
                            key={index}
                            style={{
                                top: (currentTop += i ? isNaN(itemSize(index - 1, true)) ? 0 : itemSize(index - 1, true) : 0),
                                left: 0,
                                width: "100%",
                                height: itemSize(index, true)
                            }}
                        />
                    ))}
                    {children}
                </div>
            );
        }}
    </StickyListContext.Consumer>
));

const StickyList = ({
                        children,
                        stickyIndices,
                        items,
                        itemSize,
                        StickyComponent,
                        RowComponent,
                        handleStickyIndex,
                        onItemResize,
                        infinityListRef,
                        rowHeights,
                        classes,
                        isItemLoaded,
                        loadMoreItems,
                        innerElementType,
                        itemCount,
                        threshold = 100,
                        minimumBatchSize = 50,
                        ...otherData
                    }) => (
    <AutoSizer>
        {({height, width}) => {
            const data = createItemData({
                ItemRenderer: children,
                stickyIndices,
                items,
                itemSize,
                StickyComponent,
                RowComponent,
                handleStickyIndex,
                onItemResize,
                rowHeights,
                classes,
                ...otherData
            });
            return (
                <StickyListContext.Provider value={data}>
                    <InfiniteLoader
                        isItemLoaded={isItemLoaded}
                        itemCount={itemCount}
                        loadMoreItems={loadMoreItems}
                        ref={infinityListRef}
                        threshold={threshold}
                        minimumBatchSize={minimumBatchSize}
                    >
                        {({onItemsRendered, ref}) => (
                            <List
                                itemData={data}
                                height={height}
                                width={width}
                                itemSize={itemSize}
                                onItemsRendered={onItemsRendered}
                                ref={ref}
                                innerElementType={innerElementType}
                                itemCount={itemCount}
                            >
                                {ItemWrapper}
                            </List>
                        )}
                    </InfiniteLoader>
                </StickyListContext.Provider>
            );
        }}
    </AutoSizer>
);

let _rowHeights = null;
let _minRowIndex = 0;
const debouncedHandleItemResize = debounce((callback, ...params) => callback(...params), 50, {
    leading: false,
    trailing: true,
    // maxWait: 30
})

const InfiniteStickyList = (
    {
        items,
        defaultItemSize,
        ref,
        shouldForceUpdate,
        StickyComponent,
        RowComponent,
        classes,
        stickyIndices: controlledStickyIndices,
        setStickyIndices: controlledSetStickyIndices,
        ignoreIndices = [],
        ...rest
    }) => {
    const [_items] = useState([{}, ...items]);
    const _infinityListRef = useRef();
    const infinityListRef = ref || _infinityListRef;
    const [_stickyIndices, _setStickyIndices] = useState(controlledStickyIndices && controlledSetStickyIndices ? [] : controlledStickyIndices || []);

    const stickyIndices = controlledStickyIndices && controlledSetStickyIndices ?
        controlledStickyIndices : _stickyIndices,
        setStickyIndices = controlledSetStickyIndices || _setStickyIndices;
    const [rowHeights, setRowHeights] = useState(() =>
        new Array(items.length + 1).fill(true).map(() => defaultItemSize)
    );
    const itemSize = (index, checkSticky) =>
        index
            ? ((!checkSticky && stickyIndices.includes(index))|| ignoreIndices.includes[index+1])
            ? 0
            : rowHeights[index]
            : stickyIndices.reduce((offset, index) => offset + rowHeights[index], 0);
    const handleItemResize = (rowIndex, height, width, isScrolling) => {
        if (!_rowHeights) {
            _rowHeights = rowHeights;
            _minRowIndex = rowIndex;
        }
        _rowHeights = update(_rowHeights, {
            [rowIndex]: {$set: isNaN(height) ? rowHeights[rowIndex] : height}
        });
        const _handleItemResize = (rowIndex, height, /*width*/) => {
            setRowHeights(
                _rowHeights
                // update(_rowHeights, {
                //     [rowIndex]: {$set: isNaN(height) ? rowHeights[rowIndex] : height}
                // })
            );
            _rowHeights = null;
            _minRowIndex = rowHeights.length;
            infinityListRef.current &&
            infinityListRef.current._listRef &&
            infinityListRef.current._listRef.resetAfterIndex &&
            infinityListRef.current._listRef.resetAfterIndex(rowIndex, shouldForceUpdate);
        };
        if (isScrolling) {
            debouncedHandleItemResize(_handleItemResize, Math.min(rowIndex, _minRowIndex), height, width);
        } else {
            debouncedHandleItemResize.cancel();
            _handleItemResize(Math.min(rowIndex, _minRowIndex), height);
        }
    };

    const handleStickyIndex = index => {
        const indexOfSticky = stickyIndices.indexOf(index);
        if (indexOfSticky !== -1) {
            setStickyIndices(
                update(stickyIndices, {$splice: [[indexOfSticky, 1]]})
            );
        } else {
            setStickyIndices(update(stickyIndices, {$push: [index]}));
        }
    };
    useEffect(() => {
        ref && (ref.current.hooks = {
            handleStickyIndex,
            getRowHeights: () => [...rowHeights],
            setRowHeights,
            stickyIndices,
            setStickyIndices,
            itemSize,
        });
    }, [
        infinityListRef && infinityListRef.current,
        handleStickyIndex,
        rowHeights,
        setRowHeights,
        stickyIndices,
        setStickyIndices,
        itemSize,
    ]);
    console.log(classes)

    return (
        <StickyList
            innerElementType={innerElementType}
            itemCount={items.length + 1}
            itemSize={itemSize}
            stickyIndices={stickyIndices}
            items={_items}
            infinityListRef={infinityListRef}
            StickyComponent={StickyComponent}
            RowComponent={RowComponent}
            handleStickyIndex={handleStickyIndex}
            onItemResize={handleItemResize}
            rowHeights={rowHeights}
            classes={classes}
            {...rest}
        >
            {RowWrapper}
        </StickyList>
    );
};

InfiniteStickyList.propTypes = {
    items: PropTypes.array.isRequired,
    defaultItemSize: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    StickyComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]),
    RowComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]),
    ref: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]),
    classes: PropTypes.object,
    stickyIndices: PropTypes.array,
    minimumBatchSize: PropTypes.number,
    threshold: PropTypes.number,
    ignoreIndices: PropTypes.array,
};

export default InfiniteStickyList;

const styles = theme => ({
    row: {},
    sticky: {
        backgroundColor: theme.palette.background.default,
        position: 'sticky !important',
        zIndex: 1,
    },
});

const defaultItems = new Array(200).fill(true).map((rowHeight, i) => ({
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
        }, 0)
    );
};

const defaultRow = ({index, style, data}) => <Inspector
    data={{height: data.itemSize(index), ...data.items[index], ...style}}/>;
const defaultStickyButton = ({isSticky, onStickyChange}) => (
    <button
        style={{position: "absolute", top: 0, left: 0, zIndex: 1}}
        onClick={onStickyChange}
    >
        {isSticky ? "*" : "-"}
    </button>
);

export const InfiniteStickyListDemo = withStyles(styles)(InfiniteStickyList);

InfiniteStickyListDemo.defaultProps = {
    items: defaultItems,
    defaultItemSize: 30,
    StickyComponent: defaultStickyButton,
    RowComponent: defaultRow,
    isItemLoaded: defaultIsItemLoaded,
    loadMoreItems: defaultLoadMoreItems,
    stickyIndices: [],
}
