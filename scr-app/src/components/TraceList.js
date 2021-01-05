import React, {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';
import isString from 'lodash/isString';
import JSAN from 'jsan';

import {alpha, darken, lighten, withStyles} from '@material-ui/core/styles';
import Pin from 'mdi-material-ui/Pin';
import PinOutline from 'mdi-material-ui/PinOutline';

import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';


import InfiniteStickyList from './InfiniteStickyList';
import ObjectExplorer from './ObjectExplorer';

import {PastebinContext, TABLE_ROW_HEIGHT} from '../containers/Pastebin';
import {
    configureGoToTimelineBranch,
    HighlightPalette
} from '../containers/LiveExpressionStore';
import OverflowComponent from './OverflowComponent';

import Highlighter from 'react-highlight-words';
import {usePrevious} from '../utils/reactUtils';

const actionStyles = () => ({
    stickyButton: {
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        flexFlow: 'row',
    },
    defaultButton: {
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        flexFlow: 'row',
    },
});

const getStyledComponent = (
    Component = Pin,
    styles = {className: {fontSize: '.8rem'}}
) => withStyles(styles)(
    ({classes}) => (<Component className={classes.className}/>)
);

const StickyPin = getStyledComponent();
const StickyPinHover = getStyledComponent(PinOutline);
const DefaultPin = getStyledComponent(
    PinOutline,
    {
        className: {
            fontSize: '.8rem',
            color: 'grey',
            opacity: 0.1,
        }
    });

const stickyPin = <StickyPin/>;
const stickyPinHover = <StickyPinHover/>;
const defaultPin = <DefaultPin/>;

export const StickyAction = withStyles(actionStyles)(
    ({classes, isSticky, onStickyChange}
    ) => {
        const [isHovered, setIsHovered] = useState(false);
        const hoverIn = useCallback(
            () => setIsHovered(true)
            , [setIsHovered]
        );
        const hoverOut = useCallback(
            () => setIsHovered(false)
            , [setIsHovered]
        );
        return (
            <IconButton
                onClick={onStickyChange}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
                size="small"
                className={
                    isSticky ? classes.stickyButton
                        : classes.defaultButton
                }
            >
                {
                    isSticky ? stickyPin
                        : isHovered ? stickyPinHover
                        : defaultPin
                }
            </IconButton>
        )
    });

const expressionCellMaxWidth = 600;
const expressionCellMinWidth = 100;
const valueCellMinWidth = 200;
const valueCellMaxWidth = 'unset';

const styles = theme => ({
    row: {},
    sticky: {
        backgroundColor: theme.palette.background.default,
        position: 'sticky !important',
        zIndex: 2,
    },
    root: {
        width: '100%',
        height: '100%',
    },
    tableCell: {
        margin: 0,
        padding: theme.spacing(0.5),
    },
    valueCell: {
        margin: 0,
        padding: theme.spacing(0.5),
        borderBottom: 0,
        maxWidth: valueCellMaxWidth,
        minWidth: valueCellMinWidth,
        minHeight: TABLE_ROW_HEIGHT,
    },
    table: {
        minWidth: 'calc(100%)',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    tableRow: {
        '&$hover:hover': {
            backgroundColor: HighlightPalette.text,
        },
        cursor: 'pointer',
    },
    tableRowError: {
        backgroundColor: alpha(HighlightPalette.error, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        backgroundColor: alpha(HighlightPalette.graphical, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.graphical,
        }
    },
    tableRowInput: {
        // height: TABLE_ROW_HEIGHT,
    },
    hover: {},
    bottomAction: {
        margin: theme.spacing(4),
    },
    cellParamContainer: {
        display: 'flex',
        alignItems: 'center',
        flexFlow: 'row',
    },
    cellParam: {
        marginLeft: theme.spacing(1),
    },
    icon: {
        fontSize: theme.spacing(2),
        color: theme.palette.mode === 'light'
            ? lighten(alpha(theme.palette.divider, 1), 0.6)
            : darken(alpha(theme.palette.divider, 1), 0.4)
    },
    bottomValueCell: {
        borderTop: `1px solid ${
            theme.palette.mode === 'light'
                ? lighten(alpha(theme.palette.divider, 1), 0.88)
                : darken(alpha(theme.palette.divider, 1), 0.8)
        }`,
    },
    commandText: {
        fontFamily: 'Menlo, monospace',
        fontSize: 12,
    },
    tableHeadRow: {
        height: TABLE_ROW_HEIGHT + 16,
    },
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    tableRowHover: {
        '&:hover': {
            backgroundColor: theme.palette.grey[200],
        },
    },
    noClick: {
        cursor: 'initial',
    },
    rowContainer: {
        display: 'flex',
        alignItems: 'center',
        flexFlow: 'row',
    },
    hoverObject: {
        backgroundColor: alpha(HighlightPalette.object, 0.05),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.object,
        },
    },
    hoverGraphical: {
        backgroundColor: HighlightPalette.graphical,
        '&$hover:hover': {
            backgroundColor: alpha(HighlightPalette.graphical, 0.2),
        }
    },
    hoverError: {
        backgroundColor: alpha(HighlightPalette.error, 0.2),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    expressionCellRoot: {
        borderBottom: 0,
        overflow: 'hidden',
        display: 'table-cell',
        verticalAlign: 'inherit',
        textAlign: 'left',
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        maxWidth: expressionCellMaxWidth,
        minWidth: expressionCellMinWidth,
        minHeight: TABLE_ROW_HEIGHT,
    },
    valueCellFill: {
        flex: 'auto',
        width: '100%',
        overflow: 'hidden',
        margin: 0,
        padding: theme.spacing(1),
        borderBottom: 0,
    },
    expressionCellContent: {
        overflow: 'auto',
        maxWidth: expressionCellMaxWidth,
        minWidth: expressionCellMinWidth,
        '&::-webkit-scrollbar': {
            display: 'none' /* Hide scrollbar for IE, Edge and Firefox */
        },
        msOverflowStyle: 'none',  /* IE and Edge */
        scrollbarWidth: 'none',  /* Firefox */
    },
    tableHeadCell: {
        marginLeft: theme.spacing(35),
    },
    cellPadding: {
        paddingLeft: theme.spacing(6),
    },
    highlight: {
        backgroundColor: lighten(alpha(theme.palette.secondary.main, 1), 0.8),
    }
});

function createData(id, entry) {
    return {id, entry};
}

const RowContainer = forwardRef(
    ({isSticky, classes, children}, ref) =>
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

const rowColumnStylesDefault = ([
    {
        flex: 1,
    },
    {
        flex: 3,
    },
]);

const Row = ({index, data}) => {
    const {
        classes, objectClasses,
        objectNodeRenderer, searchWords,
        goToTimelineBranch, configureMappingEventListeners,
        columnStyles = rowColumnStylesDefault, parsed,
        itemsCache,
    } = data;

    const item = useMemo(() => (data.items[index] || {}), [data, index]);
    const _n = item.entry;
    const _result = (_n && _n.chunksResult);

    const findChunks = useCallback(
        () => ((_result && _result.expressionChunks) || [])
        , [_result]);

    const {
        onMouseEnter, onMouseLeave, onClick
    } = useMemo(
        () => configureMappingEventListeners(_n || {})
        , [configureMappingEventListeners, _n]);

    const buttonClick = useCallback(() => {
        onClick();
        _n && goToTimelineBranch()(_n.entry);
    }, [onClick, goToTimelineBranch, _n]);

    if (index) {
        const n = _n || {};


        let objectExplorer = null;

        if (itemsCache?.[index]) {
            objectExplorer = itemsCache[index];
        }

        if (!itemsCache || !itemsCache[index]) {
            parsed[n.id] =
                parsed[n.id] || {
                    current: (isString(n.value) ?
                        JSAN.parse(n.value) : n.value)
                };
            const parsedValue = parsed[n.id].current;


            const outputRefs = (n.entry && n.entry.outputRefs) || [];
            objectExplorer = (<ObjectExplorer
                variant={"marker"}
                expressionId={n.expressionId}
                objectNodeRenderer={objectNodeRenderer}
                data={parsedValue}
                outputRefs={outputRefs}
            />);

            if (itemsCache) {
                itemsCache[index] = objectExplorer
            }
        }

        return (<>
                <TableCell
                    component="div"
                    classes={objectClasses.tableCell}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    style={columnStyles[0]}
                >
                    <OverflowComponent
                        disableOverflowDetectionY={true}
                        contentClassName={classes.expressionCellContent}
                    >
                        <ButtonBase
                            onClick={buttonClick}
                        >
                            <Typography
                                align='left'
                                noWrap
                                variant='code'
                            >
                                <Highlighter
                                    highlightClassName={classes.highlight}
                                    searchWords={searchWords}
                                    textToHighlight={n.expression || ''}
                                    autoEscape={true}
                                    findChunks={findChunks}
                                />
                            </Typography>
                        </ButtonBase>
                    </OverflowComponent>
                </TableCell>
                <TableCell
                    component="div"
                    className={classes.valueCell}
                    classes={
                        n.isError ? objectClasses.hoverError
                            : n.isGraphical ? objectClasses.hoverGraphical
                            : objectClasses.hoverObject
                    }
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    style={columnStyles[1]}
                >
                    {objectExplorer}
                </TableCell>
            </>

        );
    }

    return null;
};

const EmptyRow = withStyles(styles)(({classes}) => {
    const tableClasses = useMemo(
        () => ({root: classes.valueCellFill}
        ), [classes]);
    return (
        <TableRow
            hover
            component="div"
            className={classes.rowContainer}
        >
            <TableCell
                component="div"
                classes={tableClasses}
                align={'center'}
            >
                <Typography
                    noWrap
                    variant='code'
                >
                    No trace entries yet.
                </Typography>
            </TableCell>
        </TableRow>
    );
});

export const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

function WindowedTable(props) {
    const {
        order,
        orderBy,
        data, searchState, onHandleTotalChange, objectNodeRenderer,
        handleSelectClick, isRowSelected,
        HighlightTypes, highlightSingleText, setCursorToLocation,
        traceSubscriber,
        heightDelta, autoScroll, isNew, highlightErrors,
        configureMappingEventListeners,
        classes,
    } = props;


    const [parsed, setParsed] = useState({});
    const [itemsCache, setItemsCache] = useState(null);
    const [stickyIndices, setStickyIndices] = useState([]);

    useEffect(
        () => {
            isNew && setParsed({});
            isNew && setItemsCache(null);
            //hard to know expression id between code edits
            isNew && setStickyIndices([]);
        }
        , [isNew, setParsed]);

    const objectClasses = useMemo(
        () => ({
            tableCell: {root: classes.expressionCellRoot},
            hoverError: {root: classes.hoverError},
            hoverGraphical: {root: classes.hoverGraphical},
            hoverObject: {root: classes.hoverObject},
        }),
        [classes]);

    const {
        totalMatches, ignoreIndices, items, searchWords
    } = useMemo(() => {
        const {value, matchesFilterTrace} = searchState;
        const ignoreIndices = [];
        const matchedData = [];
        data.forEach((n, i) => {
            const newN = {
                ...n, isMatch: true, chunksResult: matchesFilterTrace(n)
            };

            if (!newN.chunksResult.found || !newN.expression) {
                newN.isMatch = false;
            }

            if (n.isError) {
                newN.isMatch = true;
            }

            if (newN.isMatch) {
                matchedData.push(newN);
            } else {
                ignoreIndices.push(i);
            }
        });

        return {
            totalMatches: matchedData.length,
            items: matchedData.map((entry, i) => createData(i, entry)),
            ignoreIndices,
            searchWords: [value],
        }
    }, [data, searchState]);

    const _prevItems = usePrevious(items);
    const _prevOrder = usePrevious(order);
    const _prevOrderBy = usePrevious(orderBy);
    useEffect(
        () => {
            if (!_prevItems || !items) {
                return;
            }

            const delta = items.length - _prevItems.length;

            if (delta > 0) {
                order !== 'asc' && setStickyIndices(
                    stickyIndices.map(
                        i => i + delta
                    )
                );
            } else {
                delta && setStickyIndices([]);
            }


        }
        , [stickyIndices, setStickyIndices, items, _prevItems, order, orderBy]
    );

    useEffect(
        () => {
            if (orderBy === 'time') {
                if (order !== _prevOrder) {
                    order === 'asc' && setStickyIndices(
                        //+1 due to sticky row container
                        stickyIndices.map(i => items.length + 1 - i)
                    );
                }
            } else {
                if (order !== _prevOrder || orderBy !== _prevOrderBy) {
                    setStickyIndices([]);
                }
            }
        }
        , [
            stickyIndices, setStickyIndices, items,
            order, _prevOrder, orderBy, _prevOrderBy
        ]
    );

    useEffect(
        () => {
            onHandleTotalChange(totalMatches)
        },
        [totalMatches, onHandleTotalChange]
    );

    highlightErrors && highlightErrors();

    const goToTimelineBranch = configureGoToTimelineBranch;

    const isItemLoaded = useCallback((/*index*/) => true, []);//!!items[index];
    const loadMoreItems = useCallback((/*startIndex, stopIndex*/) => {
        return new Promise(resolve => resolve());
    }, []);

    const autoScrollTo = order === 'asc' ? 'bottom' : 'top';

    const listProps = {
        estimatedItemSize: TABLE_ROW_HEIGHT,
        itemsCache,
        parsed,
        items,
        autoScrollTo,
        StickyComponent: StickyAction,
        RowComponent: Row,
        RowContainer,
        isItemLoaded,
        loadMoreItems,
        stickyIndices,
        setStickyIndices,
        ignoreIndices,
        isRowSelected,
        objectNodeRenderer,
        setCursorToLocation,
        heightDelta,
        autoScroll,
        handleSelectClick,
        highlightSingleText,
        searchState,
        searchWords,
        goToTimelineBranch,
        HighlightTypes,
        traceSubscriber,
        configureMappingEventListeners,
        EmptyRowComponent: EmptyRow,
        objectClasses,
    };
    return (<StyledInfiniteStickyList {...listProps}/>);
}

const WindowedTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => <WindowedTable {...props} {...context}/>}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(WindowedTableWithContext);