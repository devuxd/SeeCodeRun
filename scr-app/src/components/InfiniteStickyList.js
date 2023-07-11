import {
    createContext,
    forwardRef,
    memo,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import memoizeOne from 'memoize-one';
import AutoSizer from 'react-virtualized-auto-sizer';
import {useResizeDetector} from 'react-resize-detector';
import {areEqual, VariableSizeList as List} from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {requestAnimationFrameWhenIdle} from "../utils/renderingUtils";

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

export const getInfiniteList_listRef =
    infiniteListRef => infiniteListRef?.current?._listRef;

// Keeps track of stickyIndices and not rendering them in List.
const ListItemWrapper = memo(
    (
        {
            index, style, isScrolling
        }
    ) => {
        const {
            children: ItemRenderer, stickyIndices,
        } = useContext(StickyListContext);

        return (
            (index && stickyIndices?.includes?.(index)) ?
                null :
                <ItemRenderer
                    index={index}
                    style={style}
                    isScrolling={isScrolling}
                />
        );
    },
    areEqual
);
ListItemWrapper.displayName = 'ListItemWrapper';

// Tree root component for RowWrapper(ItemRenderer in ListItemWrapper)
const DefaultRowWrapperRoot = ({index, isSticky, classes, ...props}) => (
    <div className={isSticky ? classes.sticky : classes.row} {...props}/>
);

// Pure Component to render an item in StickyList and List
const RowWrapper = memo(
    (
        {
            index,
            style,
            isScrolling
        }
    ) => {
        const {
            StickyComponent,
            RowComponent,
            handleStickyIndex,
            onItemResize,
            RowContainer,
            RowWrapperRoot,
            isIndexSticky,
            ignoreIndices,
            ...data
        } = useContext(StickyListContext);

        const {classes = {},} = data;

        const isSticky = isIndexSticky(index);

        const observerOptions = useMemo(
            () => {
                return ({
                    // refreshMode: 'debounce',
                    // refreshRate: 1000,
                    onResize: (
                        width = 0, height = 0
                    ) => {
                        //index 0 reserved for sticky items
                        // if (index) { : removed after version 9: it creates a gap otherwise
                            onItemResize(
                                index, height, width, isScrolling
                            )
                        // }
                    },
                });
            },
            [index, isScrolling, onItemResize]
        );

        const {ref} = useResizeDetector(observerOptions);

        const onStickyChange = useCallback(
            () => handleStickyIndex(index)
            , [handleStickyIndex, index]
        );

        // console.log('ignoreIndices', ignoreIndices.length);

        return (
            <RowWrapperRoot
                index={index}
                isSticky={isSticky}
                classes={classes}
                style={style}
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
                        data={data}
                    />
                </RowContainer>
            </RowWrapperRoot>
        );
    }
    ,
    areEqual
);
RowWrapper.displayName = 'RowWrapper';

const StickyRows = (
    {
        containerRef,
        style,
        children
    }
) => {
    const {
        stickyIndices,
        stickyRowsStyles,
    } = useContext(StickyListContext);

    return (
        <div
            ref={containerRef}
            style={style}
        >
            {stickyIndices.map(
                (index, i) => (
                    <RowWrapper
                        key={index}
                        index={index}
                        style={stickyRowsStyles[i]}
                    />
                )
            )}
            {children}
        </div>
    );
};

const innerElementType = forwardRef((
    {
        children,
        style,
    },
    containerRef
) => {
    return (
        <StickyRows
            containerRef={containerRef}
            style={style}
        >
            {children}
        </StickyRows>
    )
});

const useShallowPropValuesMemo = () => {

    const {memoize, shallowPropsValuesMemo} = useMemo(
        () => {
            let cacheMiss = false;
            let cachedProps = {};
            const handler = () => {
                cacheMiss = true;
            }
            const memoize = memoizeOne(handler);

            const shallowPropsValuesMemo = props => {
                memoize(...Object.values(props));
                if (cacheMiss) {
                    cachedProps = props;
                    cacheMiss = false;
                }

                return cachedProps;
            };

            return {
                memoize,
                shallowPropsValuesMemo
            }

        },
        []
    );

    useEffect(
        () => {
            return () => memoize?.clear?.();
        },
        [memoize]
    );

    return shallowPropsValuesMemo;
}


const StickyList = (
    ({
         itemSize,
         infinityListRef,
         isItemLoaded,
         loadMoreItems,
         innerElementType,
         itemCount,
         threshold,
         minimumBatchSize,
         overscanCount,
         heightDelta,
         onScroll,
         ...props
     }) => {


        const shallowPropsValuesMemo = useShallowPropValuesMemo();

        const autoSized = useCallback(
            (
                {height = 0, width = 0}
            ) => (
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
                            height={height - heightDelta}
                            width={width}
                            itemSize={itemSize}
                            onItemsRendered={onItemsRendered}
                            ref={ref}
                            innerElementType={innerElementType}
                            itemCount={itemCount}
                            onScroll={onScroll}
                            overscanCount={overscanCount}
                        >
                            {ListItemWrapper}
                        </List>
                    )}
                </InfiniteLoader>
            ),
            [
                itemSize,
                infinityListRef,
                isItemLoaded,
                loadMoreItems,
                innerElementType,
                itemCount,
                threshold,
                minimumBatchSize,
                overscanCount,
                heightDelta,
                onScroll,
            ]
        );

        return (
            <StickyListContext.Provider value={shallowPropsValuesMemo(props)}>
                <AutoSizer>
                    {autoSized}
                </AutoSizer>
            </StickyListContext.Provider>
        )
    });

const InfiniteStickyList = (
    {
        ref,
        classes,
        RowWrapperRoot = DefaultRowWrapperRoot,
        StickyComponent,
        RowContainer,
        RowComponent,
        EmptyRowComponent,
        items: controlledItems,
        ignoreIndices: controlledIgnoreIndices,
        ignoreIndex: controlledIgnoreIndex,
        stickyIndices: controlledStickyIndices,
        setStickyIndices: controlledSetStickyIndices,
        estimatedItemSize = 22,
        minimumItemSize = 22,
        heightDelta = 0,
        sortOrder = 'none',
        autoScrollTo = 'default',
        autoScroll,
        isItemLoaded,
        loadMoreItems,
        ...restDataProps
    }) => {
    const isAutoScrollBottom = autoScrollTo === 'bottom';

    const _infinityListRef = useRef(null);
    const infinityListRef = ref ?? _infinityListRef;
    const infinityListResetAfterIndex = useCallback(
        (
            index,
            shouldForceUpdate
        ) => getInfiniteList_listRef(infinityListRef)?.resetAfterIndex?.(
            index,
            shouldForceUpdate
        ),
        [infinityListRef]
    );

    // always up to date
    const _variablesRef = useRef({
        rowHeights: {},
        rowIndexes: [],
        minRowIndex: -1,
        disposeRequestMinRowIndex: null,
    });

    // committed changes after sizing debounce
    const [rowHeights, setRowHeights] = useState({});

    const requestInfinityListResetAfterMinIndex = useCallback(
        (rowIndex) => {
            _variablesRef.current.rowIndexes.push(rowIndex);

            const minRowIndex = _variablesRef.current.minRowIndex;
            _variablesRef.current.minRowIndex = minRowIndex === -1 ? rowIndex :
                Math.min(rowIndex, minRowIndex);

            const disposeRequestMinRowIndex =
                _variablesRef.current.disposeRequestMinRowIndex;
            if (disposeRequestMinRowIndex) {
                disposeRequestMinRowIndex();
            }
            _variablesRef.current.disposeRequestMinRowIndex =
                requestAnimationFrameWhenIdle(
                    null,
                    () => {
                        setRowHeights({..._variablesRef.current.rowHeights});
                        infinityListResetAfterIndex(
                            _variablesRef.current.minRowIndex
                        );
                        _variablesRef.current.minRowIndex = -1;
                    }
                );
        },
        []
    );

    //adds placeholder 0 for sticky items container
    const items = useMemo(
        () => update(
            controlledItems, {$unshift: [{}]}),
        [controlledItems]
    );

    const [_ignoreIndices, _setIgnoreIndex] = useState([]);
    const ignoreIndices = controlledIgnoreIndices ?? _ignoreIndices;
    const _ignoreIndex = useCallback(
        (i) => {
            _setIgnoreIndex(_ignoreIndices => [..._ignoreIndices, i]);
        },
        []
    );
    const ignoreIndex = controlledIgnoreIndex ?? _ignoreIndex;

    const [_stickyIndices, _setStickyIndices] = useState([]);

    const stickyIndices = controlledStickyIndices ?? _stickyIndices;
    const setStickyIndices = controlledSetStickyIndices ?? _setStickyIndices;

    const handleStickyIndex = useCallback(
        index => {
            setStickyIndices(stickyIndices => {
                const indexOfSticky = stickyIndices.indexOf(index);
                if (indexOfSticky !== -1) {
                    return (
                        update(stickyIndices, {$splice: [[indexOfSticky, 1]]})
                    );
                } else {
                    return (
                        update(stickyIndices, {$push: [index]})
                    );
                }
            });
        },
        [setStickyIndices]
    );

    const stickyContainerItemSize = useMemo(
        () => stickyIndices.reduce(
            (offset, index) => {
                let currentHeight =
                    rowHeights[index] ?? _variablesRef.current.rowHeights[index];
                currentHeight =
                    isNaN(currentHeight) ? estimatedItemSize : currentHeight;
                currentHeight = ignoreIndices.includes(index) ? 0 : currentHeight;
                if (ignoreIndices.includes(index)) {
                    // console.log('ignoreIndices', ignoreIndices.length);
                }
                // console.log('!ignoreIndices', index, ignoreIndices.includes[index]);
                return offset + currentHeight;
            },
            0
        ),
        [rowHeights, stickyIndices, estimatedItemSize, ignoreIndices]
    );

    const itemSize = useCallback(
        (index, isStickyStyle) => {
            if (index === 0) {
                return stickyContainerItemSize;
            }

            if ((!isStickyStyle && stickyIndices.includes(index)) ||
                ignoreIndices.includes(index)
            ) {
                return 0;
            }

            let currentHeight = _variablesRef.current.rowHeights[index];
            currentHeight =
                isNaN(currentHeight) ? estimatedItemSize : currentHeight;

            return Math.max(minimumItemSize, currentHeight);
        },
        [
            stickyIndices, ignoreIndices,
            minimumItemSize, estimatedItemSize, stickyContainerItemSize
        ]);

    const onItemResize = useCallback(
        (rowIndex, height/*, width, isScrolling*/) => {
            let currentHeight = _variablesRef.current.rowHeights[rowIndex];
            currentHeight =
                isNaN(currentHeight) ? estimatedItemSize : currentHeight;

            let newHeight = isNaN(height) ? currentHeight : height;

            if (currentHeight === newHeight) {
                return;
            }

            _variablesRef.current.rowHeights[rowIndex] = newHeight;

            requestInfinityListResetAfterMinIndex(rowIndex);
        },
        [
            estimatedItemSize, requestInfinityListResetAfterMinIndex
        ]
    );

    const isIndexSticky = useCallback(
        (index) => stickyIndices.includes(index)
        ,
        [stickyIndices]
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
                            prevIndex ? itemSize(prevIndex, true) ?? 0 : 0
                            : 0
                    ),
                    left: (prevIndex = index) || 0,
                })
            );
        },
        [stickyIndices, itemSize]
    );

    useEffect(() => {
            if (!autoScroll || !items) {
                return () => null;
            }

            const itemCount = items.length;

            return requestAnimationFrameWhenIdle(
                null,
                () => {
                    return getInfiniteList_listRef(infinityListRef)?.scrollToItem?.(
                        isAutoScrollBottom ? itemCount : 0, "center"
                    );
                }
            );

        },
        [
            items, infinityListRef,
            isAutoScrollBottom, autoScroll,
        ]
    );

    useEffect(
        () => {
            requestInfinityListResetAfterMinIndex?.(0);

            return () => !stickyIndices;
        }
        , [stickyIndices, requestInfinityListResetAfterMinIndex]
    );

    useEffect(
        () => {
            return requestAnimationFrameWhenIdle(
                null,
                () => {
                    if (!rowHeights) {
                        return;
                    }
                    const minRowIndex = _variablesRef.current.rowIndexes.findIndex(
                        rowIndex => stickyIndices.includes(rowIndex)
                    );

                    if (minRowIndex > -1) {
                        requestInfinityListResetAfterMinIndex?.(0);
                    }

                    _variablesRef.current.rowIndexes = [];

                }
            );

        }
        , [stickyIndices, rowHeights, requestInfinityListResetAfterMinIndex]
    );

    return (
        items.length < 2 && EmptyRowComponent ?
            <EmptyRowComponent/>
            : <StickyList
                {...{
                    itemCount: items.length,
                    onItemResize,
                    itemSize,
                    items,
                    innerElementType,
                    stickyIndices,
                    setStickyIndices,
                    ignoreIndices,
                    ignoreIndex,
                    isIndexSticky,
                    stickyRowsStyles,
                    infinityListRef,
                    handleStickyIndex,
                    RowWrapperRoot,
                    StickyComponent,
                    RowContainer,
                    RowComponent,
                    classes,
                    heightDelta,
                    estimatedItemSize,
                    isItemLoaded,
                    loadMoreItems,
                    ...restDataProps
                }}
            >
                {RowWrapper}
            </StickyList>
    );
};

InfiniteStickyList.propTypes = {
    sortOrder: PropTypes.string,
    items: PropTypes.array.isRequired,
    ignoreIndices: PropTypes.array,
    minimumItemSize: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    estimatedItemSize: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    RowWrapperRoot: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]),
    RowContainer: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]).isRequired,
    RowComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]).isRequired,
    StickyComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ]).isRequired,
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
    heightDelta: PropTypes.number,
    autoScroll: PropTypes.bool,
    autoScrollTo: PropTypes.oneOf(['top', 'bottom', 'default']),
};

export default InfiniteStickyList;
