import React, {
    createContext,
    forwardRef,
    memo,
    useRef,
    useState,
    useCallback,
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

import {useLodashDelayable} from '../utils/reactUtils';

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

const createItemData = memoize(props => ({...props}));

const fixStyle = (style, checkHeight, checkTop) => {
    const _style = {...style};

    if (checkHeight && isNaN(style.height)) {
        _style.height = 0;
    }
    if (checkTop && isNaN(style.top)) {
        _style.top = 0;
        _style.display = 'none';
    }
    return _style;
}

const ItemWrapper = memo(({data, index, style, ...other}) => {
    const {ItemRenderer, stickyIndices} = data;
    if (stickyIndices && index && stickyIndices.includes(index)) {
        return null;
    }
    return <ItemRenderer data={data} index={index} style={style} {...other} />;
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

    const _style = fixStyle(style, true, true);

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
            const _style = fixStyle(style, true);
            return (
                <div
                    ref={ref}
                    style={_style}
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

const InfiniteStickyList = (
    {
        debounceTime = 15,
        scrollDebounceTime = 5,
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
    const [_variables] = useState({
        _minRowIndex: 0,
        _prevItemCount: 0,
        _rowHeights: null,
    });
    const [_stickyIndices, _setStickyIndices] =
        useState(
            controlledStickyIndices && controlledSetStickyIndices ?
                [] : controlledStickyIndices || []
        );

    const [rowHeights, setRowHeights] = useState(() =>
        new Array(items.length + 1)
            .fill(true)
            .map(() => defaultItemSize)
    );

    const [debouncedHandleItemResize] = useLodashDelayable(
        debounce,
        (callback, ...params) => callback(...params),
        debounceTime,
        {
            leading: false,
            trailing: true,
            maxWait: debounce * 3,
        });
    const [debouncedAutoScroll] = useLodashDelayable(
        debounce,
        (callback, ...params) => callback(...params),
        scrollDebounceTime,
        {
            leading: false,
            trailing: true,
            maxWait: scrollDebounceTime * 3,
        });

    const _items = useMemo(
        () => debouncedAutoScroll.cancel() || update(
            items, {$unshift: [{}]}),
        [items, debouncedAutoScroll]
    );

    useEffect(() => {
            const infinityListRefCurrent = infinityListRef.current;
            const _autoScrollTop = (autoScroll || autoScrollTop);
            const isAutoScroll = _autoScrollTop || autoScrollBottom;
            if (isAutoScroll && items &&
                _variables._prevItemCount !== items.length) {
                infinityListRefCurrent &&
                infinityListRefCurrent._listRef &&
                infinityListRefCurrent._listRef.scrollToItem &&
                debouncedAutoScroll(
                    () => infinityListRefCurrent._listRef.scrollToItem(
                        autoScrollBottom ? 0 : items.length, "center"
                    )
                );
            }
            _variables._prevItemCount = items ? items.length : 0;
        }, [
            items, debouncedAutoScroll, infinityListRef,
            autoScrollBottom, autoScroll, autoScrollTop, _variables
        ]
    );

    const stickyIndices =
            controlledStickyIndices && controlledSetStickyIndices ?
                controlledStickyIndices : _stickyIndices,
        setStickyIndices = controlledSetStickyIndices || _setStickyIndices;

    const itemSize = useCallback((index, checkSticky) => index ?
        ((!checkSticky && stickyIndices.includes(index)) ||
            ignoreIndices.includes[index + 1]) ? 0
            : rowHeights[index]
        : stickyIndices.reduce(
            (offset, index) => offset + rowHeights[index], 0
        ), [stickyIndices, rowHeights, ignoreIndices]);

    const handleItemResize = useCallback(
        (rowIndex, height, width, isScrolling) => {


            if (!_variables._rowHeights) {
                _variables._rowHeights = rowHeights;
                _variables._minRowIndex = rowIndex;
            }
            _variables._rowHeights = update(
                _variables._rowHeights, {
                    [rowIndex]: {
                        $set: isNaN(height) ? rowHeights[rowIndex] : height
                    }
                });
            const _handleItemResize = (rowIndex) => {
                setRowHeights(
                    _variables._rowHeights
                );
                _variables._rowHeights = null;
                _variables._minRowIndex = rowHeights.length;
                const infinityListRefCurrent = infinityListRef.current;
                infinityListRefCurrent &&
                infinityListRefCurrent._listRef &&
                infinityListRefCurrent._listRef.resetAfterIndex &&
                infinityListRefCurrent._listRef.resetAfterIndex(
                    stickyIndices.includes(rowIndex) ?
                        0
                        : rowIndex
                    , shouldForceUpdate
                );
            };
            if (isScrolling) {
                debouncedHandleItemResize(
                    () => _handleItemResize(
                        Math.min(rowIndex, _variables._minRowIndex)
                    )
                );
            } else {
                debouncedHandleItemResize.cancel();
                _handleItemResize(
                    Math.min(rowIndex, _variables._minRowIndex)
                );
            }
        },
        [
            _variables, debouncedHandleItemResize, infinityListRef, rowHeights,
            shouldForceUpdate, stickyIndices,
        ]
    );

    const handleStickyIndex = useCallback(index => {
        const infinityListRefCurrent = infinityListRef.current;
        const indexOfSticky = stickyIndices.indexOf(index);
        if (indexOfSticky !== -1) {
            setStickyIndices(
                update(stickyIndices, {$splice: [[indexOfSticky, 1]]})
            );
        } else {
            setStickyIndices(update(stickyIndices, {$push: [index]}));
        }

        infinityListRefCurrent &&
        infinityListRefCurrent._listRef &&
        infinityListRefCurrent._listRef.resetAfterIndex &&
        infinityListRefCurrent._listRef.resetAfterIndex(
            0, shouldForceUpdate
        );
    }, [
        infinityListRef, setStickyIndices, shouldForceUpdate, stickyIndices,
    ]);
    useEffect(() => {
        ref && ref.current && (ref.current.hooks = {
            handleStickyIndex,
            rowHeights,
            setRowHeights,
            stickyIndices,
            setStickyIndices,
            itemSize,
            infinityListRef,
        });
    }, [
        ref,
        infinityListRef,
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