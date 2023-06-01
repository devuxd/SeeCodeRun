import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useContext
} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import isString from 'lodash/isString';


import {useSandboxIFrameHandler} from '../utils/reactUtils';
import {
    RALE, ALEContext
} from '../core/modules/ALE';

import GraphicalMapper from './GraphicalMapper';

import {
    updatePlaygroundLoad,
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess,
    updatePlaygroundLoadCanceled,
} from "../redux/modules/playground";
import {editorIds} from "../core/AppManager";
import PastebinContext from "../contexts/PastebinContext";

const mapStateToProps = ({
                             updateBundleReducer,
                             updatePlaygroundReducer,
                             firecoReducer,
                             monacoEditorsReducer
                         }) => {
    const {isFirecoEditorsReady} = firecoReducer;
    const {timestamp, bundle} = updateBundleReducer;
    const {
        isPlaygroundUpdating,
        isPlaygroundUpdated,
        isPlaygroundCorrupted,
        // isPlaygroundUpdatingCanceled,
    } = updatePlaygroundReducer;
    const monacoEditor =
        monacoEditorsReducer?.monacoEditorsStates?.js?.firecoPad?.monacoEditor;
    // console.log("BUNDLE", bundle, updateBundleReducer);
    return {
        timestamp,
        bundle, // address disconnect when there is a previous bundle value
        monacoEditor,
        activatePlayground: isFirecoEditorsReady && !!bundle,
        isPlaygroundUpdating,
        isPlaygroundUpdated,
        isPlaygroundCorrupted,
        // isPlaygroundUpdatingCanceled
    };
};
const mapDispatchToProps = {
    updatePlaygroundLoad,
    updatePlaygroundLoadSuccess,
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadCanceled,
};

const styles = () => ({
    mapperContainer: {
        overflow: 'hidden'
    },
    iframeContainer: {
        height: '100%',
        width: '100%',
    },
    resizeBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        backgroundColor: 'transparent',
    }
});

const Playground = (
    {
        timestamp,
        bundle,
        autorunDelay,
        monacoEditor,
        editorIds,
        isPlaygroundUpdating,
        isPlaygroundUpdated,
        isPlaygroundCorrupted,
        // isPlaygroundUpdatingCanceled,
        updatePlaygroundLoad,
        updatePlaygroundLoadSuccess,
        updatePlaygroundLoadFailure,
        updatePlaygroundLoadCanceled,
        isAutoLogActive,
        isGraphicalLocatorActive,
        handleChangeGraphicalLocator,
        activatePlayground,
        resizeListener,
        classes,
        onUnsafeAct
    }
) => {
    const {
        data,
        // isNew, searchState, highlightErrors, order,
        // ...rest
        //configureMappingEventListeners,
        // orderBy, objectNodeRenderer,
        // handleSelectClick, isRowSelected,
        // highlightSingleText, setCursorToLocation,
        // traceSubscriber,
    } = useContext(PastebinContext);
    const {aleInstance, activateAleInstance} = useContext(ALEContext);
    const cacheRef = useRef({});
    const [key, setKey] = useState(0);
    const [isResizing, setIsResizing] = useState(null);
    const [visualElements, setVisualElements] = useState([]);

    const handleChangeKey = useCallback(
        () => setKey(key => key + 1),
        []
    );

    useEffect(() => {
        resizeListener && resizeListener(setIsResizing);
        return () => resizeListener?.(null);
    }, [resizeListener, setIsResizing]);

    const prepareIframe = useCallback(iFrame => {
            return iFrame;
        },
        []
    );

    const [playgroundRef, iFrameRefHandler] = //sandboxRef, iFrameHandler
        useSandboxIFrameHandler(document, prepareIframe);

    // useEffect(() => {
    //         if (!activatePlayground || !monacoEditor) {
    //             return () => {
    //             };
    //         }
    //
    //         activateAleInstance(monacoEditor, handleChangeKey, onUnsafeAct);
    //         return () => {
    //         };
    //     },
    //     [activatePlayground, monacoEditor, handleChangeKey, activateAleInstance]
    // );

    /**
     *
     * @param {Object} bundle -  bundle.editorsTexts requires editorsTexts.html,
     * editorsTexts.css and editorsTexts.js to contain text.
     */
    const updateIframe = useCallback(() => {
        if (!isAutoLogActive) {
            return;
        }
        bundle?.autoLog?.updateIframe(bundle.aleInstance, bundle, playgroundRef, iFrameRefHandler, updatePlaygroundLoadSuccess, updatePlaygroundLoadFailure);
    }, [
        bundle,
        iFrameRefHandler,
        playgroundRef,
        editorIds,
        updatePlaygroundLoad,
        updatePlaygroundLoadSuccess,
        updatePlaygroundLoadFailure,
        isAutoLogActive]);

    const onResizeFalse = useCallback(
        () => {
            setIsResizing(false);
        },
        [setIsResizing]
    );

    useEffect(() => {
            setKey(key => key + 1);
            setVisualElements([]);
            return () => null;
        },
        [timestamp, bundle]
    );

    // useEffect(() => {
    //         if (!timestamp || isPlaygroundUpdatingCanceled) {
    //             return () => null;
    //         }
    //         console.log("useEffect", "updatePlaygroundLoadCanceled", {timestamp, isPlaygroundUpdatingCanceled});
    //         updatePlaygroundLoadCanceled(editorIds.js, "updateBundleSuccess");
    //         return () => null;
    //     },
    //     [timestamp, isPlaygroundUpdatingCanceled]
    // );


    useEffect(() => {

            if (!bundle) {
                return () => null;
            }

            let isReactSafe = true;
            const reactSafeUpdateIframe = () => {
                if (!isReactSafe) {
                    return;
                }
                isReactSafe = false;
                updateIframe()
            };

            updatePlaygroundLoad(editorIds.js, reactSafeUpdateIframe);

            return () => {
                isReactSafe = false;
            };

        },
        [bundle, updateIframe]
    );

    // bundleRef.current.updateIframe = updateIframe;

    // useEffect(() => {
    //         if (!bundleRef.current?.bundle || !isPlaygroundUpdating) {
    //             return () => null;
    //         }
    //         //
    //         // const tid = setTimeout(
    //         //     () => {
    //         //
    //         //     },
    //         //     10);
    //
    //         console.log("useEffect", "updateIframe", {bundle: bundleRef.current.bundle});
    //         // bundleRef.current.autoLog.updateIframe(bundleRef.current.bundle);
    //         // bundleRef.current.bundle = null;
    //         updateIframe();
    //         return () => {
    //             console.log("useEffect", "updatePlaygroundLoadCanceled", {bundle: bundleRef.current.bundle});
    //             // clearTimeout(tid);
    //             updatePlaygroundLoadCanceled(editorIds.js, "isPlaygroundUpdating");
    //         };
    //
    //     },
    //     [isPlaygroundUpdating, updateIframe]
    // );

    const scrObject = aleInstance?.scr;

    useEffect(
        () => {
            if (!scrObject) {
                return () => null;
            }

            return scrObject.setOnDomNodeAdded(
                (domNodeAdded, domNodes) => {
                    setVisualElements(domNodes);
                }
            );
        },
        [scrObject]
    );

    return activatePlayground &&
        (<>
            <div
                className={classes.mapperContainer}
            >
                <GraphicalMapper
                    containerRef={playgroundRef}
                    key={key}
                    isGraphicalLocatorActive={isGraphicalLocatorActive}
                    handleChangeGraphicalLocator={handleChangeGraphicalLocator}
                    visualElements={visualElements}
                />
            </div>
            <div
                ref={playgroundRef}
                className={classes.iframeContainer}
            />
            {
                aleInstance &&
                <>
                    <RALE
                    data ={data}
                    aleInstance={aleInstance}
                    cacheRef={cacheRef}
                />
                    <div>YOLO</div>
                </>
            }
            {
                isResizing &&
                <div className={classes.resizeBackdrop}
                     onClick={onResizeFalse}/>
            }
        </>);
}

Playground.propTypes = {
    autorunDelay: PropTypes.string,
    editorIds: PropTypes.object.isRequired,
    isAutoLogActive: PropTypes.bool.isRequired,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withStyles(styles)(Playground)
);
