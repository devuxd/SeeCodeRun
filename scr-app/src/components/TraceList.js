import React, {
    useState,
    useLayoutEffect,
    useEffect,
    useMemo,
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import JSAN from "jsan";

import {withStyles} from '@material-ui/core/styles';
import {darken, alpha, lighten} from '@material-ui/core/styles/colorManipulator';
import Pin from "mdi-material-ui/Pin";
import PinOutline from "mdi-material-ui/PinOutline";

import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';


import InfiniteStickyList from './InfiniteStickyList';
import ObjectExplorer from "./ObjectExplorer";

import {PastebinContext, TABLE_ROW_HEIGHT} from "../containers/Pastebin";
import {
    configureGoToTimelineBranch,
    HighlightPalette
} from '../containers/LiveExpressionStore';
import OverflowComponent from "./OverflowComponent";

import Highlighter from "react-highlight-words";
import {usePrevious} from "../utils/reactUtils";

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
const stickyPin = <Pin style={{fontSize: '.8rem'}}/>;
const stickyPinHover = <PinOutline style={{fontSize: '.8rem'}}/>;

const defaultPin = <PinOutline style={{
    fontSize: '.8rem',
    color: 'grey',
    opacity: 0.1,
}}/>;

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
        zIndex: 1,
    },
    root: {
        width: '100%',
        height: '100%',
    },
    table: {
        minWidth: 'calc(100%)',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    tableRow: {
        height: TABLE_ROW_HEIGHT,
        '&$hover:hover': {
            backgroundColor: HighlightPalette.text,
        },
        cursor: 'pointer',
    },
    tableRowError: {
        height: TABLE_ROW_HEIGHT,
        backgroundColor: alpha(HighlightPalette.error, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        // height: TABLE_ROW_HEIGHT,
        backgroundColor: alpha(HighlightPalette.graphical, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.graphical,
        }
    },
    tableRowInput: {
        height: TABLE_ROW_HEIGHT,
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
    tableCell: {
        flex: 1,
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
    },
    valueCell: {
        margin: 0,
        padding: theme.spacing(1),
        borderBottom: 0,
        maxWidth: valueCellMaxWidth,
        minWidth: valueCellMinWidth,
    },
    valueCellFill: {
        width: '100%',
        overflow: 'hidden',
        margin: 0,
        padding: theme.spacing(1),
        borderBottom: 0,
    },
    expressionCellContent: {
        overflow: 'auto',
        position: 'relative',
        paddingTop: 0,
        paddingBottom: theme.spacing(1),
        marginBottom: theme.spacing(-1),
        maxWidth: expressionCellMaxWidth,
        minWidth: expressionCellMinWidth,
    },
    expressionCellContentTypography: {
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontWeight: 'normal',
        fontSize: 11,
        // lineHeight: 14,
        letterSpacing: 0,
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

const configureMatchesFilter = (searchState) => {
    const searchWords =
        searchState.value.split(' ').filter(v => v.trim().length);
    const findChunks = (textToHighlight) => {
        return searchState.findChunks(
            {searchWords, textToHighlight}
        );
    };
    const andFindChunks =
        (textToHighlight) => searchWords.reduce(
            (acc, word) => {
                acc.push(
                    {
                        word,
                        chunks: searchState.findChunks(
                            {searchWords: [word], textToHighlight}
                        )
                    })

                return acc;
            }
            , []
        );

    const isAndFind =
        (
            wordChunks
        ) => !(wordChunks.findIndex(wordChunk => !wordChunk.chunks.length) > -1);

    return (data) => {
        const result = {
            found: false,
            functions: [],
            expressions: [],
            values: [],
            expressionChunks: [],
            isCodeMatch: false,
            isStateMatch: false,
        };

        const hasFilters =
            searchState.isFunctions ||
            searchState.isExpressions ||
            searchState.isValues;

        const isAnyText = !searchState.value.trim().length;

        if (isAnyText && !hasFilters) {
            result.found = true;
            return result;
        }

        if (searchState.isFunctions &&
            searchState.functionLikeExpressions.includes(
                data.entry.expressionType
            )) {
            result.functions = isAnyText ? [] : findChunks(data.expression);
            result.isCodeMatch = !!result.functions.length;
        }

        if (searchState.isExpressions &&
            !searchState.functionLikeExpressions.includes(
                data.entry.expressionType
            )) {
            result.expressions = isAnyText ? [] : findChunks(data.expression);
            result.isCodeMatch = result.isCodeMatch
                || !!result.expressions.length;
        }

        if (searchState.isValues) {
            result.values = isAnyText ? [] : findChunks(data.value);
            result.isStateMatch = !!result.values.length;
        }

        result.expressionChunks = result.functions.concat(
            result.expressions
        );

        if ((searchState.isFunctions || searchState.isExpressions)
            && searchState.isValues) {
            result.found =
                isAnyText
                || isAndFind(
                andFindChunks(data.expression + ' ' + data.value)
                );

        } else {
            result.found =
                isAnyText
                || (result.isCodeMatch || result.isStateMatch);
        }


        return result;
    }
};

function createData(id, entry) {
    return {id, entry};
}

const RowContainer = React.forwardRef(
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
        width: '50%',
    },
    {
        width: '100%',
    },
]);


const Row = ({index, style, data}) => {
    const {
        classes, objectClasses,
        objectNodeRenderer, searchWords,
        goToTimelineBranch, configureMappingEventListeners,
        columnStyles = rowColumnStylesDefault, parsed
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
        _n && goToTimelineBranch(_n.entry);
    }, [onClick, goToTimelineBranch, _n]);

    if (index) {
        const n = _n || {};

        parsed[n.id] =
            parsed[n.id] || {
                current: (isString(n.value) ?
                    JSAN.parse(n.value) : n.value)
            };
        const parsedValue = parsed[n.id].current;


        const outputRefs = (n.entry && n.entry.outputRefs) || [];
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
                                align={"left"}
                                noWrap
                                className={
                                    classes.expressionCellContentTypography
                                }
                            >
                                <Highlighter
                                    highlightClassName={classes.highlight}
                                    searchWords={searchWords}
                                    textToHighlight={n.expression||''}
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
                    <ObjectExplorer
                        variant={"marker"}
                        expressionId={n.expressionId}
                        objectNodeRenderer={objectNodeRenderer}
                        data={parsedValue}
                        outputRefs={outputRefs}
                    />
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
                No trace entries yet.
            </TableCell>
        </TableRow>
    );
});

export const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

function WindowedTable(props) {
    const {
        order,
        orderBy,
        estimatedItemSize = 30,
        data, searchState, onHandleTotalChange, objectNodeRenderer,
        handleSelectClick, isRowSelected,
        HighlightTypes, highlightSingleText, setCursorToLocation,
        traceSubscriber,
        heightDelta, autoScroll, isNew, highlightErrors,
        configureMappingEventListeners,
        classes,
    } = props;

    const [parsed, setParsed] = useState({})
    const [stickyIndices, setStickyIndices] = React.useState([]);

    useEffect(
        () => {
            isNew && setParsed({});
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


    const findChunks = React.useMemo(
        () => configureMatchesFilter(searchState),
        [searchState]
    );
    const searchWords = useMemo(() => [searchState.value], [searchState]);

    const {
        totalMatches, ignoreIndices, items
    } = useMemo(() => {
        const ignoreIndices = [];
        const matchedData = [];
        data.forEach((n, i) => {
            const newN = {...n, isMatch: true, chunksResult: findChunks(n)};
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
        }
    }, [data, findChunks, order, orderBy]);

    const _prevItems = usePrevious(items);
    const _prevOrder = usePrevious(order);
    const _prevOrderBy = usePrevious(orderBy);
    useLayoutEffect(
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

    useLayoutEffect(
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

    const goToTimelineBranch = useMemo(() => configureGoToTimelineBranch()
        , [configureGoToTimelineBranch]);
    const isItemLoaded = useCallback((/*index*/) => true, []);//!!items[index];
    const loadMoreItems = useCallback((/*startIndex, stopIndex*/) => {
        return new Promise(resolve => resolve());
    }, []);

    const autoScrollTo = order === 'asc' ? 'bottom' : 'top';

    const listProps = {
        parsed,
        items,
        autoScrollTo,
        estimatedItemSize,
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