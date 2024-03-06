import React, {useCallback, useLayoutEffect, useEffect, useMemo, useRef, useState} from 'react';

import Portal from '@mui/material/Portal';
import {withStyles} from '@mui/styles';
import {Global} from '@emotion/react';
import {styled} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
// import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
    alpha,
} from '@mui/material/styles';

import {grey} from '@mui/material/colors';
import Markdown from "react-markdown";

import {isArrayLikeObject} from "lodash";

import {toThrowable} from "../utils/throwableUtils";
import {CompilationErrorIcon} from "../common/icons/Software";


const drawerBleeding = 115;

const makeErrorMessageWidget = (editor, range, message, domRef, id = "Main", monaco = global.monaco) => {
    const preference = [
        monaco.editor.ContentWidgetPositionPreference.BELOW
    ];
    const domNode = domRef.current;
    const contentWidget = {
        id: `errorWidget${id}`,
        domNode,
        getId: function () {
            return this.id;
        },
        getDomNode: function () {
            return this.domNode;
        },
        getPosition: function () {
            const position = range?.getStartPosition?.();

            if (!position || !this.domNode) {
                return null;
            }

            return {
                position,
                preference,
            };
        }
    };
    // console.log("errorWidget I", contentWidget, domRef, !!domRef.current);
    editor.addContentWidget(contentWidget);
    let done = false;
    return () => {
        if (done) {
            return;
        }
        //todo: ?
        // console.log("errorWidget O", contentWidget, domRef, !!domRef.current);
        (domRef.current && editor.removeContentWidget(contentWidget))
        done = true;
    };
}

const styles = (theme) => ({
    faultMargin: {
        borderTop: `1px dashed ${theme.palette.error.light}`,
        borderBottom: `1px dashed ${theme.palette.error.light}`,
        borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.error.main}`,
    },
    faultLine: {
        borderTop: `1px dashed ${theme.palette.error.light}`,
        borderBottom: `1px dashed ${theme.palette.error.light}`,
        transition: 'border-width 0.6s linear',
    },
    faultLocation: {
        borderTop: `${theme.spacing(0.5)} solid ${theme.palette.error.main}`,
        borderBottom: `${theme.spacing(0.5)} solid ${theme.palette.error.main}`,
        backgroundColor: `${alpha(theme.palette.error.light, 0.15)}`,
    },

});

const Root = styled('div')(({theme}) => ({
    zIndex: theme.zIndex.snackbar,
    height: '100%',
    backgroundColor:
        theme.palette.mode === 'light' ? grey[100] : theme.palette.background.default,
}));

const StyledBox = styled(Box)(({theme}) => ({
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : grey[800],
}));

const Puller = styled(Box)(({theme}) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[900],
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
}));

const InlineAlert = styled(Alert)(({theme}) => ({
    // fontSize: ".5rem",
    '& .MuiAlert-message': {
        marginTop: theme.spacing(-1.5),
    },
}));

export default function SwipeableEdgeDrawer({header, children, container, onClose, onClick}) {
    const [open, setOpen] = useState(true);
    const toggleDrawer = (newOpen) => () => {
        setOpen(newOpen);
    };

    return (
        <Root>
            <CssBaseline/>
            <Global
                styles={{
                    '.MuiDrawer-root > .MuiPaper-root': {
                        height: `calc(50% - ${drawerBleeding}px)`,
                        overflow: 'visible',
                    },
                }}
            />
            <SwipeableDrawer
                anchor="bottom"
                open={open}
                onClose={toggleDrawer(false)}
                onOpen={toggleDrawer(true)}
                swipeAreaWidth={drawerBleeding}
                disableSwipeToOpen={false}
                BackdropProps={{invisible: true}}
                container={container}
                onClick={onClick}
                // anchorOrigin={{vertical, horizontal}}
                //TransitionComponent={open ? TransitionUp : TransitionDown}
            >

                {/*<StyledBox*/}
                {/*    sx={{*/}
                {/*        position: 'absolute',*/}
                {/*        top: -drawerBleeding,*/}
                {/*        borderTopLeftRadius: 8,*/}
                {/*        borderTopRightRadius: 8,*/}
                {/*        visibility: 'visible',*/}
                {/*        right: 0,*/}
                {/*        left: 0,*/}
                {/*    }}*/}

                {/*>*/}
                {/*    <Puller/>*/}
                {/*    <Button onClick={toggleDrawer(true)}>*/}
                {/*        {header}*/}
                {/*    </Button>*/}

                {/*</StyledBox>*/}

                <StyledBox
                    sx={{
                        // px: 2,
                        // pb: 2,
                        height: '100%',
                        overflow: 'auto',
                    }}
                >
                    {children}
                </StyledBox>
            </SwipeableDrawer>
        </Root>
    );
}

// todo: get rid of the notification, show icons only, and show iun live expression
const ParserErrorMessage = (
    {
        inline,
        name,
        message,
        severity = "error",
        variant = "outlined",
        focused = false,
        isRawText = false,
        ...alertProps
    }
) => {

    if (inline) {
        alertProps = {
            sx: (theme) => ({
                p: 0,
                mt: -1,
                ml: -1,
                bgcolor: 'background.paper',
                width: "max-content",
                maxHeight: "1.25rem",
                lineHeight: 1,
                overflow: 'hidden',
                '& .MuiAlert-icon': {
                    p: 0,
                    fontSize: "1.1rem",
                    marginRight: 0.5,
                    marginTop: 0,
                },
                '& .MuiAlert-message': {
                    pt: 0,
                    pb: 0,
                    pl: 0,
                    pr: 1,
                    fontSize: "0.75rem",
                    lineHeight: "1.2rem",
                    overflow: "unset",
                },
            }),
            ...alertProps
        };
    }

    return (<InlineAlert
        icon={
            <Tooltip title={name}>
                <CompilationErrorIcon fontSize="inherit"/>
            </Tooltip>
        }
        severity={severity}
        variant={variant}
        {...alertProps}
    >
        <Tooltip title={<Markdown>{message}</Markdown>}>
            {isRawText ? focused ?
                <strong>{message}</strong>
                : message : <Box><Markdown>{message}</Markdown></Box>
            }
        </Tooltip>

    </InlineAlert>);
};


const IdiomaticFault = (
    {
        designMap, // API doc, design rules, static rule checker interface
        codeMap, // source code files, editor interface
        compileMap, // babel setup, compile error, compiler interface
        executeMap, // bundling setup, scheduling task setup, browser| app debugger interface
        stateMap, // user logic (intent, actions, inactions => expected, unexpected, unknown, unseen)
        outputMap, // observable program behavior (UI)
        testMap, // checkpoints for bound expected behavior,  oracle interface

    }
) => {


};

const ParserErrorNotification = (
    {
        throwables,
        onClickThrowable,
        isFocusedThrowable,
        onClose,
    }
) => {

    const [open, setOpen] = useState(true);
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        onClose && onClose(event, reason, false);
    };


    return (<Stack
            direction="column"
            justifyContent="center"
            alignItems="stretch"
            spacing={0.5} sx={{width: '80%'}}>
            {
                throwables.map((readableBabelThrowable, i) => {
                    const {name, message} = readableBabelThrowable;

                    return (
                        <ButtonBase
                            key={`${i}-${name}-${message}`}
                            onClick={() => onClickThrowable(i)}
                        >
                            <ParserErrorMessage
                                focused={isFocusedThrowable(i)}
                                name={name}
                                message={message}
                                // sx={{width: '80%'}}
                            />
                        </ButtonBase>
                    )
                })
            }
        </Stack>
    );
}

function UnstyledEditorNotification(
    {
        editorId,
        monacoEditor,
        locToMonacoRange,
        playgroundExceptions,
        playgroundErrors,
        updateBundleErrors,
        onClose,
        vertical = 'bottom',
        horizontal = 'center',
        classes,
    }
) {
    const container = monacoEditor?.getContainerDomNode();

    const throwables = useMemo(() => {

            const editorPExceptions = playgroundExceptions?.[editorId] ?? [];
            const editorPErrors = playgroundErrors?.[editorId] ?? [];
            const editorUBErrors = updateBundleErrors?.[editorId] ?? [];

            const throwables = [...editorPExceptions, ...editorPErrors, ...editorUBErrors].map(
                e => toThrowable(e)
            );
            // throwables.length && console.log("throwables", throwables.length, {
            //     base: [...editorPExceptions, ...editorPErrors, ...editorUBErrors],
            //     throwables,
            //     editorPExceptions,
            //     editorPErrors,
            //     editorUBErrors
            // });
            // return [];
            //
            // //console.log("BI", throwables, {editorId, playgroundErrors, updateBundleErrors, playgroundExceptions});
            return throwables.map(readableBabelThrowable => {
                const name = readableBabelThrowable.getReadableName();
                const message = readableBabelThrowable.getReadableMessage();
                const range = readableBabelThrowable.getMonacoRange();
                return {name, message, range};
            });
        },
        [editorId, playgroundErrors, updateBundleErrors, playgroundExceptions]
    );

    const domRef = useRef();

    const [focusedThrowableIndex, setFocusedThrowableIndex] = useState([0, false]);
    const [iconified, setIconified] = useState(true);
    const [open, setOpen] = useState(true);

    const errorDecorationOptions = useMemo(() => {
        return {
            line: {
                isWholeLine: true,
                marginClassName: classes.faultMargin,
                className: classes.faultLine,
            },
            location: {
                className: classes.faultLocation,
            },

        };
    }, [classes]);

    const handleClickThrowable = useCallback(
        (i, forceReveal = false) => setFocusedThrowableIndex([i, forceReveal]),
        []
    );

    const isFocusedThrowable = useCallback(
        (i) => () => i === focusedThrowableIndex[0],
        [focusedThrowableIndex]
    );


    const focusOnFaultLocation = useCallback((focusedThrowable, forceReveal = false) => {
        if (!monacoEditor || !focusedThrowable) {
            return () => {
            };
        }

        const {range, message} = focusedThrowable;

        const lineDecoration = {
            range,
            options: errorDecorationOptions.line
        };

        const locationDecoration = {
            range,
            options: errorDecorationOptions.location
        };

        const ids = monacoEditor.getModel().deltaDecorations([], [lineDecoration, locationDecoration]);

        forceReveal && (range?.startLineNumber) && monacoEditor.revealLineInCenter(range.startLineNumber);

        const removeErrorWidget = makeErrorMessageWidget(
            monacoEditor, range, message, domRef
        );

        return () => {
            monacoEditor.getModel().deltaDecorations(ids, []);
            removeErrorWidget();
        }

    }, [monacoEditor, errorDecorationOptions]);
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        onClose && onClose(event, reason, false);
    };

    const handleIconView = useCallback(() => {
            //  setIconified(true);
        },
        []
    );

    const handleDrawerView = useCallback(() => {
            //   setIconified(false);
            handleClickThrowable(0); // disable reveal todo: do once, the reveal is lingering with reset
        },
        []
    );

    useLayoutEffect(() => {
            if (throwables.length < 1 || !focusOnFaultLocation) {
                return;
            }
            // console.log("useLayoutEffect I", domRef, !!domRef.current, focusedThrowableIndex[0], throwables[focusedThrowableIndex[0]]);
            const unFocus = focusOnFaultLocation(throwables[focusedThrowableIndex[0]], focusedThrowableIndex[1]);


            return () => {
                // console.log("useLayoutEffect O", domRef, !!domRef.current);

                unFocus();
            };
        },
        [focusedThrowableIndex, throwables, focusOnFaultLocation]
    );


    const parserErrorNotification = (<ParserErrorNotification
        throwables={throwables}
        onClickThrowable={handleClickThrowable}
        isFocusedThrowable={isFocusedThrowable}
        onClose={onClose}
    />);

    const currentThrowable = throwables[focusedThrowableIndex[0]];

    const neverForget = <div ref={domRef}>
        {
            currentThrowable ?
                <ParserErrorMessage inline name={currentThrowable.name} message={currentThrowable.message}/>
                : null
        }
    </div>;
    // never put refs in conditional rendering
    // const neverForget = currentThrowable ? <div ref={domRef}>
    //     <ParserErrorMessage inline name={currentThrowable.name} message={currentThrowable.message}/>
    // </div> : null;

    return (<>
            {neverForget}
            {
                throwables.length ?
                    iconified ? <>
                        <Tooltip title={`Compilation Errors: ${throwables.length}`}>
                            <Fab
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                    bottom: 4,
                                }}
                                size="small" color="error"
                                aria-label="compilation error"
                                onClick={handleDrawerView}>

                                <Badge badgeContent={throwables.length} color="warning">
                                    <CompilationErrorIcon/>
                                </Badge>
                            </Fab>
                        </Tooltip>
                        {parserErrorNotification}
                    </> : <SwipeableEdgeDrawer
                        container={container}
                        header={"YOLO"}
                        // onClose={handleClose}
                        onClick={handleIconView}
                    >
                        {parserErrorNotification}
                    </SwipeableEdgeDrawer>
                    : null
            }
        </>

    );
}

export const EditorNotification = withStyles(styles)(UnstyledEditorNotification);
