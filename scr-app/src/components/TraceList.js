import React from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import JSAN from "jsan";

import {withStyles} from '@material-ui/core/styles';
import {darken, fade, lighten} from '@material-ui/core/styles/colorManipulator';
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

let expressionCellMaxWidth = 300;
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
        backgroundColor: fade(HighlightPalette.error, 0.25),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.error,
        },
    },
    tableRowGraphical: {
        // height: TABLE_ROW_HEIGHT,
        backgroundColor: fade(HighlightPalette.graphical, 0.25),
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
        color: theme.palette.type === 'light'
            ? lighten(fade(theme.palette.divider, 1), 0.6)
            : darken(fade(theme.palette.divider, 1), 0.4)
    },
    bottomValueCell: {
        borderTop: `1px solid ${
            theme.palette.type === 'light'
                ? lighten(fade(theme.palette.divider, 1), 0.88)
                : darken(fade(theme.palette.divider, 1), 0.8)
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
        backgroundColor: fade(HighlightPalette.object, 0.05),
        '&$hover:hover': {
            backgroundColor: HighlightPalette.object,
        },
    },
    hoverGraphical: {
        backgroundColor: HighlightPalette.graphical,
        '&$hover:hover': {
            backgroundColor: fade(HighlightPalette.graphical, 0.2),
        }
    },
    hoverError: {
        backgroundColor: fade(HighlightPalette.error, 0.2),
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
    },
    valueCell: {
        margin: 0,
        padding: theme.spacing(1),
        borderBottom: 0,
    },
    expressionCellContent: {
        overflow: 'auto',
        position: 'relative',
        maxWidth: expressionCellMaxWidth,
        paddingTop: 0,
        paddingBottom: theme.spacing(1),
        marginBottom: theme.spacing(-1),
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
        backgroundColor: lighten(fade(theme.palette.secondary.main, 1), 0.8),
    }
});

const configureMatchesFilter = (searchState) => {
    const searchWords = searchState.value.split(' ').filter(v => v.trim().length);
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

    const isAndFind = (wordChunks) => !(wordChunks.findIndex(wordChunk => !wordChunk.chunks.length) > -1);

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


const Row = ({index, style, data}) => {
    if (!index) {
        return null;
    }
    const n = (data.items[index] || {}).entry || {};
    const result = n.chunksResult;


    const {
        classes, objectNodeRenderer, searchState,
        goToTimelineBranch, configureMappingEventListeners,
        columnStyles = [
            {width: '40%'},
            {width: '60%'},
        ]
    } = data;
    parsed[n.id] =
        parsed[n.id] || {
            current: (isString(n.value) ?
                JSAN.parse(n.value) : n.value)
        };

    const parsedValue = parsed[n.id].current;
    const {
        onMouseEnter, onMouseLeave, onClick
    } = configureMappingEventListeners(n);


    return (
        <React.Fragment>
            <TableCell
                component="div"
                classes={{root: classes.expressionCellRoot}}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={columnStyles[0]}
            >
                <OverflowComponent
                    contentClassName={classes.expressionCellContent}
                    disableOverflowDetectionY={true}
                >
                    <ButtonBase onClick={
                        () => {
                            onClick();
                            goToTimelineBranch(n.entry);
                        }
                    }>
                        <Typography align={"left"}
                                    className={
                                        classes.expressionCellContentTypography
                                    }
                                    noWrap>
                            <Highlighter
                                highlightClassName={classes.highlight}
                                searchWords={[searchState.value]}
                                textToHighlight={n.expression}
                                autoEscape={true}
                                findChunks={() => result.expressionChunks}
                            />
                        </Typography>
                    </ButtonBase>
                </OverflowComponent>
            </TableCell>
            <TableCell
                component="div"
                className={classes.valueCell}
                classes={{
                    root: n.isError ? classes.hoverError
                        : n.isGraphical ? classes.hoverGraphical
                            : classes.hoverObject,
                    // hover: classes.hover
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={columnStyles[1]}
            >
                <ObjectExplorer
                    expressionId={n.expressionId}
                    objectNodeRenderer={objectNodeRenderer}
                    data={parsedValue}
                    outputRefs={n.entry.outputRefs}
                />
            </TableCell>
        </React.Fragment>

    );
};

export const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

let parsed = {};

function WindowedTable(props) {
    const {
        defaultItemSize = 32,
        data, searchState, onHandleTotalChange, objectNodeRenderer,
        handleSelectClick, isRowSelected,
        HighlightTypes, highlightSingleText, setCursorToLocation,
        traceSubscriber,
        heightDelta, autoScroll, isNew, highlightErrors,
        configureMappingEventListeners
    } = props;
    if (isNew) {
        parsed = {};
    }
    const [stickyIndices, setStickyIndices] = React.useState([]);
    const findChunks = React.useMemo(
        () => configureMatchesFilter(searchState),
        [searchState]
    );
    let totalMatches = 0;
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

    totalMatches = matchedData.length;

    React.useEffect(
        () => onHandleTotalChange(totalMatches),
        [totalMatches]
    );
    const rows = matchedData.map((entry, i) => createData(i, entry));
    highlightErrors && highlightErrors();

    const goToTimelineBranch = configureGoToTimelineBranch();
    const isItemLoaded = index => true;//!!rows[index];
    const loadMoreItems = (startIndex, stopIndex) => {
        return new Promise(
            resolve => resolve()
        );
    };
    const StickyAction = React.memo(({isSticky, onStickyChange}) => (
        <IconButton
            onClick={onStickyChange}
            size="small"
            style={{
                zIndex: isSticky ? 1 : 0,
                display: 'flex',
                alignItems: 'center',
                flexFlow: 'row',
            }}
        >
            {isSticky ? <Pin style={{fontSize: '.8rem'}}/> :
                <PinOutline style={{fontSize: '.8rem'}}/>}
        </IconButton>
    ));

    const listProps = {
        items: rows,
        defaultItemSize,
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
        goToTimelineBranch,
        HighlightTypes,
        traceSubscriber,
        configureMappingEventListeners
    };
    return (
        <StyledInfiniteStickyList
            {...listProps}
        />

    );
}

const WindowedTableWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => <WindowedTable {...props} {...context}/>}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(WindowedTableWithContext);