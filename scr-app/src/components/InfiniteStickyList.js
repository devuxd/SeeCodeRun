import React, {
    createContext,
    forwardRef,
    memo,
    useRef,
    useState,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo
} from "react";
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import memoizeOne from 'memoize-one';
import isDeepEqual from 'lodash.isequal';
import update from "immutability-helper";
import AutoSizer from "react-virtualized-auto-sizer";
import useResizeObserver from "use-resize-observer";
import {VariableSizeList as List, areEqual} from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

import {useLodashDelayable} from '../utils/reactUtils';

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

export const getInfiniteList_listRef = (infiniteListRef) => {
    return (infiniteListRef?.current?._listRef);
};
const identity = x => x;
const deepMemoized = memoizeOne(identity, isDeepEqual);

const createItemData = props => deepMemoized(props);

const useFixStyle = (
    {style, checkHeight, checkTop, checkOffset = true, isHidden}
) => useMemo(
    () => {
        const _style = {...style};

        if (checkHeight && isNaN(style.height)) {
            _style.height = 0;
        }
        if (checkTop && isNaN(style.top)) {
            _style.top = 0;
            _style.display = 'none';
        }

        if (checkOffset && isNaN(style.offset)) {
            _style.offset = 0;
        }
        if (isHidden) {
            _style.overflow = 'hidden';
        }
        return _style;
    },
    [style, checkHeight, checkTop, checkOffset, isHidden]
);


const ItemWrapper = memo(({data, index, style, /*isScrolling,*/ ...other}) => {
    const {ItemRenderer, stickyIndices} = data;
    if (stickyIndices && index && stickyIndices.includes(index)) {
        return null;
    }
    return <ItemRenderer data={data} index={index} style={style} {...other} />;
}, areEqual);


const defaultIsIndexSticky = (
    index, stickyIndices
) => stickyIndices.includes(index);

const RowWrapper = (({
                         index,
                         style,
                         data,
                         isIndexSticky = defaultIsIndexSticky,
                         ...other
                     }) => {
    const {
        StickyComponent,
        RowComponent,
        stickyIndices,
        handleStickyIndex,
        onItemResize,
        classes = {},
        RowContainer,
        isScrolling,
        RowWrapperProps = {},
    } = data;

    const isSticky = isIndexSticky(index, stickyIndices);
    const [dimensions, setDimensions] = useState({});

    useLayoutEffect(() => {
        const {index, height, width, isScrolling} = dimensions;
        //index 0 reserved for sticky items
        index &&
        onItemResize(index, height, width, isScrolling);

    }, [onItemResize, dimensions]);

    const observerOptions = useMemo(() => ({
        onResize: ({
                       width = 0, height = 0
                   }) => setDimensions({index, height, width, isScrolling}),
        //  onPosition: () => onItemResize(index, itemSize(index))
    }), [setDimensions, index, isScrolling]);

    const {ref} = useResizeObserver(observerOptions);

    const _style = useFixStyle(
        {
            style,
            checkHeight: true,
            checkTop: true,
            checkOffset: true,
            isHidden: !index
        }
    );

    const onStickyChange = useCallback(
        () => handleStickyIndex(index)
        , [handleStickyIndex, index]
    );

    return (
        <div
            className={isSticky ? classes.sticky : classes.row}
            style={_style}
            {...RowWrapperProps}
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
                    onStickyChange={onStickyChange}
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

const StickyRows = ({
                        containerRef,
                        containerStyle,
                        containerRest,
                        itemSize,
                        stickyIndices,
                        dataRest,
                        children
                    }) => {
    let currentTop = 0;
    let prevIndex = 0;
    const data = deepMemoized({
        itemSize,
        stickyIndices,
        ...dataRest
    });
    return (
        <div
            ref={containerRef}
            style={containerStyle}
            {...containerRest}
        >
            {stickyIndices.map((index, i) => (
                <MemoizedRowWrapper
                    data={data}
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
};

const innerElementType = forwardRef(({
                                         children,
                                         style,
                                         ...containerRest
                                     },
                                     containerRef) => {
    const containerStyle =
        useFixStyle({
            style,
            checkHeight: true,
        });
    return (
        <StickyListContext.Consumer>
            {({stickyIndices, itemSize, ...dataRest}) => (
                <StickyRows
                    {...{
                        containerRef,
                        containerStyle,
                        containerRest,
                        itemSize,
                        stickyIndices,
                        dataRest,
                    }}
                >
                    {children}
                </StickyRows>
            )}
        </StickyListContext.Consumer>
    )
});

const StickyList = ({
                        children,
                        stickyIndices,
                        items,
                        itemSize,
                        estimatedItemSize,
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
                        threshold = 150,
                        minimumBatchSize = 5,
                        overscanCount = 10,
                        heightDelta = 0,
                        onScrollChange,
                        ...otherData
                    }) => {
    return (
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
                                    // estimatedItemSize={estimatedItemSize}
                                    itemSize={itemSize}
                                    onItemsRendered={onItemsRendered}
                                    ref={ref}
                                    innerElementType={innerElementType}
                                    itemCount={itemCount}
                                    onScroll={onScrollChange}
                                    overscanCount={overscanCount}
                                >
                                    {ItemWrapper}
                                </List>
                            )}
                        </InfiniteLoader>
                    </StickyListContext.Provider>
                );
            }}
        </AutoSizer>
    )
};

const InfiniteStickyList = (
    {
        debounceTime = 100,
        scrollDebounceTime = 1000,
        items,
        ignoreIndices = [],
        estimatedItemSize = 30,
        ref,
        shouldForceUpdate,
        StickyComponent,
        RowComponent,
        classes,
        stickyIndices: controlledStickyIndices,
        setStickyIndices: controlledSetStickyIndices,
        heightDelta,
        autoScroll,
        autoScrollTo = 'default',
        EmptyRowComponent,
        sortOrder = 'none',
        ...rest
    }) => {

    //adds placeholder 0 for sticky items container
    const _items = useMemo(
        () => update(
            items, {$unshift: [{}]}),
        [items]
    );

    const _infinityListRef = useRef(null);
    const infinityListRef = ref || _infinityListRef;

    const isAutoScrollBottom = autoScrollTo === 'bottom';

    const _variablesRef = useRef({
        _minRowIndex: 0,
        _prevItemCount: 0,
        _rowHeights: null,
    });
    const {current: _variables} = _variablesRef;

    const [_stickyIndices, _setStickyIndices] =
        useState(
            controlledStickyIndices && controlledSetStickyIndices ?
                [] : controlledStickyIndices || []
        );

    const [rowHeights, setRowHeights] = useState([]);

    // console.log(estimatedItemSize, items.length, rowHeights.length);
    const scrollTimeRef = useRef({});
    const [isScrolling, setIsScrolling] = useState(0);
    const onScrollChange = useCallback(
        () => setIsScrolling(isScrolling + 1)
        , [isScrolling, setIsScrolling]
    );
    useEffect(() => {
            clearTimeout(scrollTimeRef.current.tid);
            if (isScrolling) {
                scrollTimeRef.current.tid = setTimeout(() => {
                    setIsScrolling(0);
                }, 1000);
            }

        },
        [isScrolling, setIsScrolling, scrollTimeRef]
    );


    const [debouncedHandleItemResize] = useLodashDelayable(
        debounce,
        (callback, ...params) => callback(...params),
        debounceTime,
        {
            leading: false,
            trailing: true,
        });
    const updatingTimeRef = useRef({});
    const [isUpdating, setIsUpdating] = useState(0);
    const onUpdatingChange = useCallback(
        (callback) => {
            updatingTimeRef.current.callback = callback;
            setIsUpdating(isUpdating => isUpdating + 1)
        }
        , [setIsUpdating, updatingTimeRef]
    );
    useLayoutEffect(() => {
            if (isUpdating) {
                clearTimeout(updatingTimeRef.current.tid);
                updatingTimeRef.current.tid = setTimeout(() => {
                    if (updatingTimeRef.current.callback) {
                        debouncedHandleItemResize.cancel();
                        updatingTimeRef.current.callback();
                        updatingTimeRef.current.callback = null;
                    }
                    setIsUpdating(0);
                }, 10);
            }

        }, [
            isUpdating, setIsUpdating,
            updatingTimeRef, debouncedHandleItemResize
        ]
    );
    useLayoutEffect(() => {
            const _listRef = getInfiniteList_listRef(infinityListRef);
            if (autoScroll && items &&
                _variables._prevItemCount !== items.length) {
                _listRef && _listRef.scrollToItem
                && _listRef.scrollToItem(
                    isAutoScrollBottom ? items.length : 0, "center"
                );
            }
            _variables._prevItemCount = items ? items.length : 0;
        }, [
            items, infinityListRef,
            isAutoScrollBottom, autoScroll, _variables
        ]
    );

    const stickyIndices =
            controlledStickyIndices && controlledSetStickyIndices ?
                controlledStickyIndices : _stickyIndices,
        setStickyIndices = controlledSetStickyIndices || _setStickyIndices;

    const itemSize = useCallback(
        (index, checkSticky) => index ?
            ((!checkSticky && stickyIndices.includes(index)) ||
                ignoreIndices.includes[index + 1]) ? 0
                : isNaN(rowHeights[index]) ? estimatedItemSize
                : rowHeights[index]
            : stickyIndices.reduce(
                (offset, index) => offset + (
                    isNaN(rowHeights[index]) ? estimatedItemSize
                        : rowHeights[index]
                ), 0
            ), [stickyIndices, rowHeights, ignoreIndices, estimatedItemSize]);

    const _handleItemResize = useCallback((minRowIndex) => {
        setRowHeights(
            _variables._rowHeights
        );

        const _listRef = getInfiniteList_listRef(infinityListRef);

        _listRef && _listRef.resetAfterIndex && _listRef.resetAfterIndex(
            stickyIndices.includes(minRowIndex) ? 0
                : minRowIndex
            , shouldForceUpdate
        );
        _variables._rowHeights = null;
        _variables._minRowIndex = rowHeights.length;

    }, [
        rowHeights, stickyIndices, infinityListRef, _variables, shouldForceUpdate
    ]);

    const handleItemResize = useCallback(
        (rowIndex, height, width, isScrolling) => {

            if (
                height === estimatedItemSize || rowHeights[rowIndex] === height
            ) {
                return;
            }
            if (!_variables._rowHeights) {
                _variables._rowHeights = rowHeights;
                _variables._minRowIndex = rowHeights.length;
            }
            _variables._rowHeights = update(
                _variables._rowHeights, {
                    [rowIndex]: {
                        $set: isNaN(height) ? rowHeights[rowIndex] : height
                    }
                });

            _variables._minRowIndex =
                Math.min(rowIndex, _variables._minRowIndex);


            if (isScrolling) {
                debouncedHandleItemResize(
                    () => _handleItemResize(_variables._minRowIndex)
                );
            } else {
                debouncedHandleItemResize.cancel();
                onUpdatingChange(
                    () => _handleItemResize(_variables._minRowIndex)
                );

            }
        },
        [
            _variables, debouncedHandleItemResize, rowHeights,
            _handleItemResize, estimatedItemSize, onUpdatingChange
        ]
    );

    const handleStickyIndex = useCallback(index => {

        const indexOfSticky = stickyIndices.indexOf(index);
        if (indexOfSticky !== -1) {
            setStickyIndices(
                update(stickyIndices, {$splice: [[indexOfSticky, 1]]})
            );
        } else {
            setStickyIndices(update(stickyIndices, {$push: [index]}));
        }
        const _listRef = getInfiniteList_listRef(infinityListRef);
        _listRef && _listRef.resetAfterIndex && _listRef.resetAfterIndex(
            0, shouldForceUpdate
        );
    }, [
        infinityListRef, setStickyIndices, shouldForceUpdate, stickyIndices,
    ]);

    useEffect(() => {
        const _listRef = getInfiniteList_listRef(infinityListRef);
        _listRef && _listRef.resetAfterIndex && _listRef.resetAfterIndex(
            0, shouldForceUpdate
        );
    }, [stickyIndices, infinityListRef, shouldForceUpdate]);
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
        items && !items.length && EmptyRowComponent ?
            <EmptyRowComponent/> :
            <StickyList
                innerElementType={innerElementType}
                itemCount={_items.length}
                itemSize={itemSize}
                stickyIndices={stickyIndices}
                setStickyIndices={setStickyIndices}
                items={_items}
                infinityListRef={infinityListRef}
                StickyComponent={StickyComponent}
                RowComponent={RowComponent}
                handleStickyIndex={handleStickyIndex}
                onItemResize={handleItemResize}
                rowHeights={rowHeights}
                classes={classes}
                heightDelta={heightDelta}
                onScrollChange={onScrollChange}
                estimatedItemSize={estimatedItemSize}
                {...rest}
            >
                {RowWrapper}
            </StickyList>
    );
};

InfiniteStickyList.propTypes = {
    sortOrder: PropTypes.string,
    items: PropTypes.array.isRequired,
    ignoreIndices: PropTypes.array,
    estimatedItemSize: PropTypes.oneOfType([
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
    EmptyRowComponent: PropTypes.oneOfType([
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
    // ignoreIndices: PropTypes.array,
    heightDelta: PropTypes.number,
    autoScroll: PropTypes.bool,
    autoScrollTo: PropTypes.oneOf(['top', 'bottom', 'default']),
};

export default InfiniteStickyList;