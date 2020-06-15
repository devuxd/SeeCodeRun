import React, {
    createContext,
    forwardRef,
    useState,
    memo,
    useRef,
    useEffect,
    useMemo
} from "react";
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import memoize from "memoize-one";
import update from "immutability-helper";
import AutoSizer from "react-virtualized-auto-sizer";
import useResizeObserver from "use-resize-observer";
import {VariableSizeList as List, areEqual} from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

const createItemData = memoize(props => ({...props}));

const ItemWrapper = memo(({data, index, style, ...other}) => {
    const {ItemRenderer, stickyIndices} = data;
    if (stickyIndices && index && stickyIndices.includes(index)) {
        return null;
    }
    const _style = {
        ...style
    };

    if (isNaN(style.top)) {
        _style.top = 0;
        _style.display = 'none';
    }
    return <ItemRenderer index={index} style={_style} data={data} {...other} />;
}, areEqual);

const RowWrapper = (({
                         index,
                         style,
                         isScrolling,
                         data,
                         isIndexSticky = (
                             index, stickyIndices
                         ) => stickyIndices.includes(index),
                         ...other
                     }) => {
    const {
        StickyComponent,
        RowComponent,
        stickyIndices,
        handleStickyIndex,
        onItemResize,
        classes = {},
        RowContainer
    } = data;

    const isSticky = isIndexSticky(index, stickyIndices);
    const {ref} = useResizeObserver({
        onResize: ({width = 0, height = 0}) => {
            onItemResize(index, height, width, isScrolling);
        },
        //  onPosition: () => onItemResize(index, itemSize(index))
    });

    const _style = {...style, height: isNaN(style.height) ? 0 : style.height};
    if (!index) {
        _style.overflow = 'hidden';
    }

    return (
        <div className={isSticky ? classes.sticky : classes.row}
             style={_style}
        >
            <RowContainer
                index={index}
                isSticky={isSticky}
                isScrolling={isScrolling}
                ref={ref}
                classes={classes}
            >
                <StickyComponent
                    isSticky={isSticky}
                    onStickyChange={() => handleStickyIndex(index)}
                />
                <RowComponent
                    index={index}
                    style={_style}
                    data={data}
                    {...other}
                />
            </RowContainer>
        </div>
    );
});

const MemoizedRowWrapper = memo(RowWrapper, areEqual);

const innerElementType = forwardRef(({children, style, ...rest}, ref) => (
    <StickyListContext.Consumer>
        {({stickyIndices, itemSize, ...otherData}) => {
            let currentTop = 0;
            let prevIndex = 0;
            return (
                <div
                    ref={ref}
                    style={
                        {
                            ...style,
                            height: isNaN(style.height) ? 0 : style.height
                        }
                    }
                    {...rest}
                >
                    {stickyIndices.map((index, i) => (
                        <MemoizedRowWrapper
                            data={{
                                itemSize,
                                stickyIndices,
                                ...otherData
                            }}
                            index={index}
                            key={index}
                            style={{
                                width: "100%",
                                height: itemSize(index, true),
                                top: (currentTop += i ? prevIndex ?
                                        isNaN(itemSize(prevIndex, true)) ?
                                            0 : itemSize(prevIndex, true)
                                        : 0
                                        : 0
                                ),
                                left: (prevIndex = index) || 0,
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
                        threshold = 1,
                        minimumBatchSize = 200,
                        heightDelta = 0,
                        ...otherData
                    }) => (
    <AutoSizer>
        {({height = 0, width = 0}) => {
            const data = createItemData({
                ItemRenderer: children,
                stickyIndices,
                items,
                itemSize,
                StickyComponent,
                RowComponent,
                handleStickyIndex,
                onItemResize,
                classes,
                rowHeights,
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
                                height={height - heightDelta}
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
let _prevItemCount = 0;

const InfiniteStickyList = (
    {
        debounceTime = 5,
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
        heightDelta,
        autoScroll,
        autoScrollTop,
        autoScrollBottom,
        ...rest
    }) => {
    const _infinityListRef = useRef();
    const infinityListRef = ref || _infinityListRef;

    const debouncedHandleItemResize = React.useMemo(
        () => debounce(
            (callback, ...params) => callback(...params),
            debounceTime,
            {
                leading: false,
                trailing: true,
                maxWait: 15
            }), [debounceTime]);
    const debouncedAutoScroll = React.useMemo(
        () => debounce(
            (callback, ...params) => callback(...params),
            debounceTime * 10,
            {
                leading: false,
                trailing: true,
            }), [debounceTime]);

    const _items = useMemo(
        () => debouncedAutoScroll.cancel() || update(
            items, {$unshift: [{}]}),
        [items]
    );

    useEffect(() => {
            const _autoScrollTop = (autoScroll || autoScrollTop);
            const isAutoScroll = _autoScrollTop || autoScrollBottom;
            if (isAutoScroll && items && _prevItemCount !== items.length) {
                infinityListRef.current &&
                infinityListRef.current._listRef &&
                infinityListRef.current._listRef.scrollToItem &&
                debouncedAutoScroll(
                    () => infinityListRef.current._listRef.scrollToItem(
                        autoScrollBottom ? 0 : items.length, "center"
                    )
                );
            }
            _prevItemCount = items ? items.length : 0;
        }, [
            items, infinityListRef,
            autoScroll, autoScrollBottom, autoScroll, autoScrollTop
        ]
    );
    const [_stickyIndices, _setStickyIndices] =
        useState(
            controlledStickyIndices && controlledSetStickyIndices ?
                [] : controlledStickyIndices || []
        );

    const stickyIndices =
            controlledStickyIndices && controlledSetStickyIndices ?
                controlledStickyIndices : _stickyIndices,
        setStickyIndices = controlledSetStickyIndices || _setStickyIndices;
    const [rowHeights, setRowHeights] = useState(() =>
        new Array(items.length + 1)
            .fill(true)
            .map(() => defaultItemSize)
    );
    const itemSize = (index, checkSticky) => index ?
        ((!checkSticky && stickyIndices.includes(index)) ||
            ignoreIndices.includes[index + 1]) ? 0
            : rowHeights[index]
        : stickyIndices.reduce(
            (offset, index) => offset + rowHeights[index], 0
        );
    const handleItemResize = (rowIndex, height, width, isScrolling) => {
        if (!_rowHeights) {
            _rowHeights = rowHeights;
            _minRowIndex = rowIndex;
        }
        _rowHeights = update(_rowHeights, {
            [rowIndex]: {$set: isNaN(height) ? rowHeights[rowIndex] : height}
        });
        const _handleItemResize = (rowIndex) => {
            setRowHeights(
                _rowHeights
            );
            _rowHeights = null;
            _minRowIndex = rowHeights.length;
            infinityListRef.current &&
            infinityListRef.current._listRef &&
            infinityListRef.current._listRef.resetAfterIndex &&
            infinityListRef.current._listRef.resetAfterIndex(
                stickyIndices.includes(rowIndex) ?
                    0
                    : rowIndex
                , shouldForceUpdate
            );
        };
        if (isScrolling) {
            debouncedHandleItemResize(
                () => _handleItemResize(
                    Math.min(rowIndex, _minRowIndex), height
                )
            );
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

        infinityListRef.current &&
        infinityListRef.current._listRef &&
        infinityListRef.current._listRef.resetAfterIndex &&
        infinityListRef.current._listRef.resetAfterIndex(
            0, shouldForceUpdate
        );
    };
    useEffect(() => {
        ref && (ref.current.hooks = {
            handleStickyIndex,
            rowHeights,
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
            heightDelta={heightDelta}
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
    heightDelta: PropTypes.number,
    autoScroll: PropTypes.bool,
    autoScrollTop: PropTypes.bool,
    autoScrollBottom: PropTypes.bool,
};

export default InfiniteStickyList;