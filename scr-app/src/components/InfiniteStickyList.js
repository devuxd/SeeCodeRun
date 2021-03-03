import React, {
    createContext,
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import memoizeOne from 'memoize-one';
import isEqual from 'lodash/isEqual';
import update from 'immutability-helper';
import AutoSizer from 'react-virtualized-auto-sizer';
import useResizeObserver from 'use-resize-observer';
import {areEqual, VariableSizeList as List} from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

const TIMEOUT_DEBOUNCE_MS = 100;

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

export const getInfiniteList_listRef =
    infiniteListRef => infiniteListRef?.current?._listRef;

const identity = x => x;
const deepMemoized = memoizeOne(identity, isEqual);

const createItemData = props => deepMemoized(props);

// const useFixStyle = ({
//                          style,
//                          checkHeight,
//                          checkTop,
//                          checkOffset = true,
//                          isHidden
//                      }
// ) => useMemo(
//     () => {
//         return style;
//         const _style = {...style};
//         let hasMutated;
//         if (checkHeight && isNaN(style.height)) {
//             hasMutated = true;
//             _style.height = 0;
//         }
//         if (checkTop && isNaN(style.top)) {
//             hasMutated = true;
//             _style.top = 0;
//             _style.display = 'none';
//         }
//
//         if (checkOffset && isNaN(style.offset)) {
//             hasMutated = true;
//             _style.offset = 0;
//         }
//         if (isHidden) {
//             hasMutated = true;
//             _style.overflow = 'hidden';
//         }
//
//         hasMutated && console.log(style, _style);
//         return hasMutated ? _style : style;
//     },
//     [
//         style,
//         checkHeight,
//         checkTop,
//         checkOffset,
//         isHidden
//     ]
// );


const ItemWrapper = memo(({data, index, style, isScrolling}) => {
    const {ItemRenderer, stickyIndices} = data;

    if (index && stickyIndices?.includes?.(index)) {
        return null;
    }
    return <ItemRenderer
        index={index}
        style={style}
        isScrolling={isScrolling}
        data={data}
    />;
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

    const observerOptions = useMemo(
        () => {
            let tid = null;
            return ({
                onResize: (
                    {width = 0, height = 0}
                ) => {
                    //index 0 reserved for sticky items
                    if (index) {
                        clearTimeout(tid);
                        tid = setTimeout(
                            () =>
                                onItemResize(
                                    index, height, width, isScrolling
                                )
                            ,
                            TIMEOUT_DEBOUNCE_MS
                        );
                        // clearTimeout(tid);
                    }
                },
                //  onPosition: () => onItemResize(index, itemSize(index))
            });
        },
        [index, isScrolling, onItemResize]
    );

    const {ref} = useResizeObserver(observerOptions);

    // const _style = useFixStyle(
    //     {
    //         style,
    //         checkHeight: true,
    //         checkTop: true,
    //         checkOffset: true,
    //         isHidden: !index
    //     }
    // );

    const onStickyChange = useCallback(
        () => handleStickyIndex(index)
        , [handleStickyIndex, index]
    );

    return (
        <div
            className={isSticky ? classes.sticky : classes.row}
            style={style}
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
                    style={style}
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
                        stickyRowsStyles,
                        dataRest,
                        children
                    }) => {
    const data = createItemData({
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
            {stickyIndices.map(
                (index, i) => (
                    <MemoizedRowWrapper
                        key={index}
                        data={data}
                        index={index}
                        style={stickyRowsStyles[i]}
                    />
                )
            )}
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
    // const containerStyle = useFixStyle(
    //     {
    //         style,
    //         checkHeight: true,
    //     }
    // );

    return (
        <StickyListContext.Consumer>
            {({stickyIndices, itemSize, stickyRowsStyles, ...dataRest}) => (
                <StickyRows
                    {...{
                        containerRef,
                        containerStyle: style,
                        containerRest,
                        itemSize,
                        stickyIndices,
                        stickyRowsStyles,
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
                        stickyRowsStyles,
                        items,
                        itemsCache,
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
                        threshold = 15,
                        minimumBatchSize = 10,
                        overscanCount = 15,
                        heightDelta = 0,
                        onScrollChange,
                        ...otherData
                    }) => {

    const data = createItemData({
        ItemRenderer: children,
        stickyIndices,
        stickyRowsStyles,
        items,
        itemsCache,
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
        <AutoSizer>
            {({height = 0, width = 0}) => (
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
                                onScroll={onScrollChange}
                                overscanCount={overscanCount}
                            >
                                {ItemWrapper}
                            </List>
                        )}
                    </InfiniteLoader>
                </StickyListContext.Provider>
            )}
        </AutoSizer>
    )
};

const defaultHandleResizeDebounceOptions = {
    leading: false,
    trailing: true,
    maxWait: 1000,
};

const defaultOnScrollChange = () => {
    // const defaultIsScrollingDebounceOptions = {
//     leading: false,
//     trailing: true,
//     maxWait: 150,
// };
    // const [isScrolling, setIsScrolling] = useState(0);
    // const onScrollChange = useMemo(() => {
    //         return debounce(
    //             () => setIsScrolling(isScrolling => isScrolling + 1),
    //             isScrollingDebounceWait,
    //             isScrollingDebounceOptions
    //         );
    //     },
    //     [setIsScrolling, isScrollingDebounceWait, isScrollingDebounceOptions]
    // );
    // useEffect(() => {
    //         let tid = 0;
    //         if (isScrolling) {
    //             tid = setTimeout(
    //                 () => setIsScrolling(0),
    //                 isScrollingStopDelay
    //             );
    //         }
    //         return () => clearTimeout(tid);
    //     },
    //     [isScrolling, setIsScrolling, isScrollingStopDelay]
    // );
};

const InfiniteStickyList = (
    {
        handleResizeDebounceWait = 200,
        handleResizeDebounceOptions
            = defaultHandleResizeDebounceOptions,
        items: _items,
        itemsCache,
        ignoreIndices: _ignoreIndices,
        estimatedItemSize = 22,
        minimumItemSize = 0, // 0: none
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
        onScrollChange = defaultOnScrollChange,
        ...rest
    }) => {
    const isAutoScrollBottom = autoScrollTo === 'bottom';

    const _infinityListRef = useRef(null);
    const infinityListRef = ref || _infinityListRef;

    const infinityListResetAfterIndex = useCallback(
        index => getInfiniteList_listRef(infinityListRef)?.resetAfterIndex?.(
            index,
            shouldForceUpdate
        ),
        [infinityListRef, shouldForceUpdate]
    );

    const _variablesRef = useRef({
        _minRowIndex: 0,
        _rowHeights: [],
        _prevItemCount: -1,
    });
    const {current: _variables} = _variablesRef;

    //adds placeholder 0 for sticky items container
    const items = useMemo(
        () => update(
            _items, {$unshift: [{}]}),
        [_items]
    );

    const [_ignoreIndices_] = useState([]);
    const ignoreIndices = _ignoreIndices || _ignoreIndices_;

    const [rowHeights, setRowHeights] = useState([]);

    const [_stickyIndices, _setStickyIndices] = useState([]);

    const stickyIndices = controlledStickyIndices || _stickyIndices;
    const setStickyIndices = controlledSetStickyIndices || _setStickyIndices;

    const [minRowIndex, setMinRowIndex] = useState(-1);

    const stickyContainerItemSize = useMemo(
        () => stickyIndices.reduce(
            (offset, index) => offset + (
                isNaN(rowHeights[index]) ? estimatedItemSize
                    : rowHeights[index]
            ), 0
        ),
        [stickyIndices, rowHeights, estimatedItemSize]
    );

    const handleStickyIndex = useCallback(
        index => {
            const indexOfSticky = stickyIndices.indexOf(index);
            if (indexOfSticky !== -1) {
                setStickyIndices(
                    update(stickyIndices, {$splice: [[indexOfSticky, 1]]})
                );
            } else {
                setStickyIndices(
                    update(stickyIndices, {$push: [index]})
                );
            }

            infinityListResetAfterIndex(0);
        },
        [infinityListResetAfterIndex, setStickyIndices, stickyIndices,]
    );

    const _handleItemResize = useCallback(
        (_minRowIndex) => {//console.log('RZ', _minRowIndex);
            setRowHeights(
                _variables._rowHeights
            );
            setMinRowIndex(_minRowIndex);
        },
        [_variables, setMinRowIndex, setRowHeights]
    );

    const debouncedHandleItemResize = useMemo(() => {
            return debounce(
                () => _handleItemResize(_variables._minRowIndex),
                handleResizeDebounceWait,
                handleResizeDebounceOptions
            );
        },
        [
            _variables, _handleItemResize,
            handleResizeDebounceWait,
            handleResizeDebounceOptions
        ]
    );

    const itemSize = useCallback(
        (index, checkSticky) => {
            if (index === 0) {
                return stickyContainerItemSize;
            }

            const size = (
                (!checkSticky && stickyIndices.includes(index)) ||
                ignoreIndices.includes[index + 1]
            ) ?
                0 : isNaN(rowHeights[index]) ?
                    estimatedItemSize : rowHeights[index];

            if (minimumItemSize && size < minimumItemSize) {
                return minimumItemSize;
            }

            return size;
        },
        [
            stickyIndices, rowHeights, ignoreIndices,
            estimatedItemSize, stickyContainerItemSize
        ]);


    const handleItemResize = useCallback(
        (rowIndex, height/*, width, isScrolling*/) => {

            let newHeight = isNaN(height) ?
                _variables._rowHeights[rowIndex] ?? estimatedItemSize
                : height;

            if (minimumItemSize > 0 && newHeight < minimumItemSize) {
                newHeight = minimumItemSize;
            }

            if (_variables._rowHeights[rowIndex] === newHeight) {
                return;
            }

            if (isNaN(_variables._rowHeights[rowIndex])) {
                _variables._rowHeights[rowIndex] = newHeight;
                return;
            }

            _variables._rowHeights[rowIndex] = newHeight;

            _variables._minRowIndex = Math.min(
                rowIndex,
                _variables._minRowIndex
            );

            debouncedHandleItemResize();
        },
        [
            _variables, debouncedHandleItemResize,
            , estimatedItemSize, minimumItemSize,
        ]
    );

    const stickyRowsStyles = useMemo(
        () => {
            let currentTop = 0;
            let prevIndex = 0;
            return stickyIndices.map(
                (index, i) => ({
                    width: "100%",
                    height: itemSize(index, true),
                    top: (currentTop += i ?
                            prevIndex ? itemSize(prevIndex, true) || 0 : 0
                            : 0
                    ),
                    left: (prevIndex = index) || 0,
                })
            );
        },
        [stickyIndices, itemSize]
    );

    useEffect(
        () => {
            if (minRowIndex < 0) {
                return;
            }
            infinityListResetAfterIndex(
                stickyIndices.includes(
                    minRowIndex
                ) ? 0 : minRowIndex
            );//console.log(minRowIndex);

            _variables._rowHeights = [...rowHeights];
            _variables._minRowIndex = rowHeights.length;

            setMinRowIndex(-1);
        },
        [
            minRowIndex, setMinRowIndex, infinityListResetAfterIndex,
            stickyIndices, _variables
        ]
    );

    useEffect(() => {
            if (!autoScroll) {
                return;
            }

            if (
                items?.length > 2 && items?.length !== _variables._prevItemCount
            ) {
                let tid = setTimeout(
                    () => {
                        getInfiniteList_listRef(infinityListRef)?.scrollToItem?.(
                            isAutoScrollBottom ? items.length : 0, "center"
                        );

                        _variables._prevItemCount = items.length;
                    }, TIMEOUT_DEBOUNCE_MS);

                return () => clearTimeout(tid);
            }
        },
        [
            items, infinityListRef,
            isAutoScrollBottom, autoScroll, _variables
        ]
    );

    useEffect(
        () => {
            const tid = setTimeout(
                () => infinityListResetAfterIndex(0),
                TIMEOUT_DEBOUNCE_MS
            );
            return () => clearTimeout(tid);
        },
        [stickyIndices, infinityListResetAfterIndex]
    );

    useEffect(() => {
        if (ref?.current) {
            ref.current.hooks = {
                infinityListRef,
                handleStickyIndex,
                rowHeights,
                setRowHeights,
                stickyIndices,
                setStickyIndices,
                itemSize,
            };
        }
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
        items.length < 2 && EmptyRowComponent ?
            <EmptyRowComponent/>
            : <StickyList
                innerElementType={innerElementType}
                itemCount={items.length}
                itemSize={itemSize}
                stickyIndices={stickyIndices}
                setStickyIndices={setStickyIndices}
                stickyRowsStyles={stickyRowsStyles}
                items={items}
                itemsCache={itemsCache}
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
