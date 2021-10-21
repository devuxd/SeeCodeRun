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
   updatePlaygroundLoadFailure,
   updatePlaygroundLoadSuccess
} from "../redux/modules/playground";

const mapStateToProps = ({
                            updateBundleReducer,
                            firecoReducer,
                            monacoEditorsReducer
                         }) => {
   const {isFirecoEditorsReady} = firecoReducer;
   const {timestamp, bundle, isFirstBundle} = updateBundleReducer;
   const monacoEditor =
      monacoEditorsReducer?.monacoEditorsStates?.js?.firecoPad?.monacoEditor;
   return {
      timestamp,
      bundle,
      monacoEditor,
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
                       monacoEditor,
                       editorIds,
                       updatePlaygroundLoadSuccess,
                       updatePlaygroundLoadFailure,
                       isAutoLogActive,
                       isGraphicalLocatorActive,
                       handleChangeGraphicalLocator,
                       activatePlayground,
                       resizeListener,
                       classes,
                    }) => {
   const {aleInstance, activateAleInstance} = useContext(ALEContext);
   const bundleRef = useRef();
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
   
   useEffect(() => {
         if (!activatePlayground || !monacoEditor) {
            return null;
         }
         
         activateAleInstance(monacoEditor, handleChangeKey);
      },
      [activatePlayground, monacoEditor, handleChangeKey, activateAleInstance]
   );
   
   /**
    *
    * @param {Object} bundle -  bundle.editorsTexts requires editorsTexts.html,
    * editorsTexts.css and editorsTexts.js to contain text.
    */
   const updateIframe = useCallback(async (bundle) => {
      if (!bundle || !bundle.editorsTexts || !playgroundRef.current) {
         return;
      }
      
      const html = bundle.editorsTexts[editorIds['html']];
      const css = bundle.editorsTexts[editorIds['css']];
      const js = bundle.editorsTexts[editorIds['js']];
      
      const alJs = aleInstance?.getWrappedALECode();
      
      if (!alJs || alJs === bundleRef.current?.alJs) {
         return;
      }
      
      bundleRef.current = {bundle, alJs};
      iFrameRefHandler.removeIframe();
      
      // bundle.alJs;// Auto-logged script.
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
         //console.log('alJs',alJs);
         autoLog.configureIframe(
            iFrameRefHandler,
            updatePlaygroundLoadSuccess,
            autoLogger,
            html,
            css,
            js,
            isAutoLogActive ? alJs : js
         );
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
      aleInstance,
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
      if (!key || !bundle) {
         return;
      }
      updateIframe(bundle);
      
   }, [key, updateIframe, bundle]);
   
   const scrObject = aleInstance?.scr;
   useEffect(
      () => {
         if (!scrObject) {
            return;
         }
         const disposer = scrObject.setOnDomNodeAdded(
            (domNodeAdded, domNodes) => {
               setVisualElements(domNodes);
            }
         );
         
         return disposer;
      },
      [scrObject]
   );
   
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
            aleInstance &&
            <RALE
               aleInstance={aleInstance}
               cacheRef={cacheRef}
            />
         }
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
