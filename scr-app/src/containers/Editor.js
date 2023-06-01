import React, {
    useCallback, useMemo,
    useRef,
    useState,
    useEffect,
} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {withStyles} from '@mui/styles';
import Fab from '@mui/material/Fab';
import SettingsIcon from '@mui/icons-material/SettingsSharp';
import Skeleton from '@mui/material/Skeleton';

import {
    monacoEditorContentChanged,
    mountEditorFulfilled
} from "../redux/modules/monacoEditor";
import LiveExpressionStore from './LiveExpressionStore';
import {EditorNotification} from '../components/Notification';

const mapStateToProps = (state) => {
    const {
        updateBundleReducer, updatePlaygroundReducer, monacoEditorsReducer
    } = state;
    // console.log("RX", state, rest);

    const props = {
        playgroundExceptions: updatePlaygroundReducer.exceptions,
        playgroundErrors : updatePlaygroundReducer.errors,
        updateBundleErrors: updateBundleReducer.errors,
        monacoEditorsStates: monacoEditorsReducer.monacoEditorsStates,
    };
    // console.log("ED",props);
    return props;

};
const mapDispatchToProps = {mountEditorFulfilled, monacoEditorContentChanged};

const styles = theme => ({
    container: {
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    editor: {
        height: '100%'
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    button: {
        marginBottom: theme.spacing(1),
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    fabMoveUp: {
        transform: 'translate3d(0, -46px, 0)',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
        }),
    },
    fabMoveDown: {
        transform: 'translate3d(0, 0, 0)',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.leavingScreen,
            easing: theme.transitions.easing.sharp,
        }),
    },
});


const skeletonStyles = {
    skeleton: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        backgroundColor: 'transparent',
        paddingLeft: 48, //matches monaco's line number width
    },
};

//adapted from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    //The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min) + min);
};

const getRandomWidthPercentage = (min = 30, max = 80) => {
    return `${getRandomInt(min, max)}%`;
};

const SkeletonEditor = withStyles(skeletonStyles)((
    {
        classes,
        size = 100
    }
) => {
    const skeletons = useMemo(
        () => {
            return (new Array(size)
                    .fill(true)
                    .map((item, i) => ({
                        key: `${i}`,
                        animation: "wave",
                        width: getRandomWidthPercentage()
                    }))
                    .map(props => (<Skeleton {...props} />))
            );
        },
        [size]
    );

    return (
        <div className={classes.skeleton}>
            {skeletons}
        </div>
    );
});

const EditorContainer = (
    {
        editorId,
        classes,
        observeLiveExpressions,
        liveExpressionStoreChange,
        isConsole,
        playgroundExceptions,
        playgroundErrors,
        updateBundleErrors,
        updateMonacoEditorLayout,
        monacoOptions,
        mountEditorFulfilled,
        monacoEditorContentChanged,
        monacoEditorsStates,
        errorState,
        locToMonacoRange,
    }
) => {
    const firecoPad = monacoEditorsStates?.[editorId]?.firecoPad;
    const editorRef = useRef();
    const disposerRef = useRef();
    const [settingsOpen] = useState(false);
    const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
    const [isMonacoEditorReady, setIsMonacoEditorReady] = useState(
        firecoPad?.isMonacoEditorReady ?? false
    );

    const handleSettingsClick = useCallback(
        () => {
        },
        []
    );

    const handleClose = useCallback(
        (event, reason, isOpen) => {
            if (reason === 'clickaway') {
                return;
            }
            setErrorSnackbarOpen(isOpen);
        },
        []
    );

    const fabClassName = useMemo(
        () => {
            return classNames(
                classes.fab,
                errorSnackbarOpen ? classes.fabMoveUp : classes.fabMoveDown
            );
        },
        [classes, errorSnackbarOpen]
    );

    useEffect(
        () => {
            const onEditorContentFirstRender = () => {
                setIsMonacoEditorReady(true);
            };

            mountEditorFulfilled(
                editorId, {
                    editorRef, monacoEditorContentChanged,
                    isConsole, monacoOptions,
                    onEditorContentFirstRender,
                    disposerRef,
                });

            return () => disposerRef.current?.dispose();
        },
        [
            monacoEditorContentChanged, isConsole, monacoOptions,
        ]
    );

    useEffect(
        () => {
            return () => updateMonacoEditorLayout?.(null);
        },
        [updateMonacoEditorLayout]
    );

    const monacoEditor = firecoPad?.monacoEditor;

    const isLoading = !(
        isConsole || (isMonacoEditorReady && monacoEditor)
    );

    return (<div className={classes.container}>
            <div ref={editorRef} className={classes.editor}/>
            {observeLiveExpressions &&
                <LiveExpressionStore
                    editorId={editorId}
                    liveExpressionStoreChange={liveExpressionStoreChange}
                    firecoPad={firecoPad}
                />
            }
            <EditorNotification
                monacoEditor={monacoEditor}
                onClose={handleClose}
                exception={errorState}
                editorId = {editorId}
                locToMonacoRange={locToMonacoRange}
                playgroundErrors={playgroundErrors}
                updateBundleErrors={updateBundleErrors}
                playgroundExceptions = {playgroundExceptions}
            />
            {settingsOpen ?
                (
                    <Fab mini="true" color="secondary" aria-label="settings"
                         className={fabClassName}
                         onClick={handleSettingsClick}>
                        <SettingsIcon/>
                    </Fab>)
                : null
            }
            {isLoading && <SkeletonEditor/>}
        </div>
    );

};

EditorContainer.propTypes = {
    editorId: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    updateMonacoEditorLayout: PropTypes.func,
    observeMouseEvents: PropTypes.bool,
    mouseEventsDisabled: PropTypes.bool,
    observeLiveExpressions: PropTypes.bool,
    setLiveExpressionStoreChange: PropTypes.func,
    mountEditorFulfilled: PropTypes.func.isRequired,
    // jsErrorState: PropTypes.object,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withStyles(styles)(EditorContainer)
);
