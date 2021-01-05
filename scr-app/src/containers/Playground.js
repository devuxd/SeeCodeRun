import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import isString from 'lodash/isString';
import GraphicalMapper from './GraphicalMapper';
import {d} from './Pastebin';
import {
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess
} from "../redux/modules/playground";

const data = {};

const mapStateToProps = ({updateBundleReducer, firecoReducer}) => {
    const {isFirecoEditorsReady} = firecoReducer;
    const {timestamp, bundle, isFirstBundle} = updateBundleReducer;
    return {
        timestamp,
        bundle,
        activatePlayground: isFirecoEditorsReady && isFirstBundle,
    };
};
const mapDispatchToProps = {
    updatePlaygroundLoadSuccess,
    updatePlaygroundLoadFailure,
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

const Playground = ({
                        bundle,
                        editorIds,
                        updatePlaygroundLoadSuccess,
                        updatePlaygroundLoadFailure,
                        isAutoLogActive,
                        isGraphicalLocatorActive,
                        handleChangeGraphicalLocator,
                        activatePlayground,
                        resizeListener,
                        classes,
                        documentObj = document
                    }) => {
    const playgroundRef = useRef();
    const iFrameRef = useRef();
    const [key, setKey] = useState(0);
    const [isResizing, setIsResizing] = useState(null);
    const [visualElements, setVisualElements] = useState([]);

    useEffect(() => {
        resizeListener && resizeListener(setIsResizing);
        return () => resizeListener?.(null);
    }, [resizeListener, setIsResizing]);

    const iFrameRefHandler = useMemo(() => ({
        removeIframe: () => {
            if (playgroundRef.current && iFrameRef.current) {
                playgroundRef.current.removeChild(iFrameRef.current);
                iFrameRef.current = null;
                return true;
            }
            return false;
        },
        createIframe: () => {
            iFrameRefHandler.removeIframe();
            return documentObj.createElement('iframe');
        },
        appendIframe: (newIFrameRefCurrent) => {
            if (!playgroundRef.current || !newIFrameRefCurrent) {
                return false;
            }
            playgroundRef.current.appendChild(newIFrameRefCurrent);
            iFrameRef.current = newIFrameRefCurrent;
            return true;
        },
        getIframe: () => iFrameRef.current,
    }), [documentObj, playgroundRef, iFrameRef]);

    /**
     *
     * @param {Object} bundle -  bundle.editorsTexts requires editorsTexts.html,
     * editorsTexts.css and editorsTexts.js to contain text.
     */
    const updateIframe = useCallback(async (bundle) => {
        if (!bundle || !bundle.editorsTexts || !playgroundRef.current) {
            return;
        }
        bundle.isActive = false;

        const html = bundle.editorsTexts[editorIds['html']];
        const css = bundle.editorsTexts[editorIds['css']];
        const js = bundle.editorsTexts[editorIds['js']];
        const alJs = bundle.alJs;// Auto-logged script.
        const autoLog = bundle.autoLog; // manager
        const autoLogger = bundle.autoLogger;// Auto-logged results and bindings

        if (
            !isString(html) || !isString(css)
            || !isString(js) || !isString(alJs)
        ) {
            // console
            // .log(
            // "[CRITICAL ERROR]: editor[s] text[s] missing",
            // html, css, js, alJs
            // );
        }

        if (alJs) {
            // console.log('alJs',alJs);
            autoLog.configureIframe(
                iFrameRefHandler,
                updatePlaygroundLoadSuccess,
                autoLogger,
                html,
                css,
                js,
                isAutoLogActive ? alJs : js
            );
            if (data.to) {
                data.from = data.to;
                data.to = alJs;
                d.log(
                    new Date(),
                    `autoLog.configureIframe(
                    this.iFrameRefHandler,
                     store, autoLogger, html, css, js, alJs
                    );`,
                    null, data.from, data.to);
                data.to = null;

            } else {
                data.to = alJs;
            }
            // d.log(new Date(), `locationMap[parentId].extraLocs = prev || {};`
            // , null, JSON.stringify(prev),
            // JSON.stringify(locationMap[parentId].extraLocs));

            // const recast = this.r;
            // var result = recast.print((recast.parse(code, {
            //     sourceFileName: "source.js"
            // })), {
            //     sourceMapName: "map.json"
            // });
            //
            // console.log(result.code, result.code === code); // Resulting string of code.
            // console.log(result.map); // JSON source map.
            //
            // const consumer = await new this.s.SourceMapConsumer(result.map,);
            // console.log(consumer.sources);
            // console.log(consumer.originalPositionFor({
            //     line: 7,
            //     column:7
            // }));


            autoLogger.trace.setDomNodeAdded(setVisualElements);
            bundle.isActive = true;
        } else {
            if (autoLogger && autoLogger.ast) {
                autoLog.configureIframe(
                    iFrameRefHandler,
                    updatePlaygroundLoadSuccess,
                    autoLogger,
                    html,
                    css,
                    js,
                    js
                );
            } else {
                updatePlaygroundLoadFailure("CRITICAL");
                console.log("CRITICAL:updatePlaygroundLoadFailure");
            }
        }
    }, [
        iFrameRefHandler,
        playgroundRef,
        editorIds,
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

    }, [bundle]);

    useEffect(() => {
        if (!key) {
            return;
        }
        iFrameRefHandler.removeIframe();
        bundle && updateIframe(bundle);
    }, [key, iFrameRefHandler, updateIframe, bundle]);

    const isShowBackDrop = isResizing;

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
                isShowBackDrop &&
                <div className={classes.resizeBackdrop}
                     onClick={onResizeFalse}/>
            }
        </>);
}

Playground.propTypes = {
    editorIds: PropTypes.object.isRequired,
    isAutoLogActive: PropTypes.bool.isRequired,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withStyles(styles)(Playground)
);
