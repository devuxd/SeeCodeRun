import React, {
   useCallback, useMemo,
   useRef,
   useState,
   useEffect
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
import Notification from '../components/Notification';

const mapStateToProps = (state) => {
   const {
      updateBundleReducer, updatePlaygroundReducer, monacoEditorsReducer
   } = state;
   // console.log("RX", state, rest);
   return {
      runTimeErrors: updatePlaygroundReducer.runtimeErrors,
      bundleErrors: updateBundleReducer.errors,
      monacoEditorsStates: monacoEditorsReducer.monacoEditorsStates
   };
   
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
const SkeletonEditor = withStyles(skeletonStyles)(({classes}) => {
   return (
      <div className={classes.skeleton}>
         <Skeleton animation="wave" width={'90%'}/>
         <Skeleton animation="wave" width={'40%'}/>
         <Skeleton animation="wave" width={'50%'}/>
         <Skeleton animation="wave" width={'80%'}/>
         <Skeleton animation="wave" width={'60%'}/>
         <Skeleton animation="wave" width={'30%'}/>
         <Skeleton animation="wave" width={'60%'}/>
         <Skeleton animation="wave" width={'40%'}/>
         <Skeleton animation="wave" width={'50%'}/>
         <Skeleton animation="wave" width={'40%'}/>
         <Skeleton animation="wave" width={'60%'}/>
         <Skeleton animation="wave" width={'30%'}/>
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
      runtimeErrors,
      bundleErrors,
      updateMonacoEditorLayout,
      monacoOptions,
      mountEditorFulfilled,
      monacoEditorContentChanged,
      monacoEditorsStates,
   }
) => {
   const firecoPad = monacoEditorsStates?.[editorId]?.firecoPad;
   const errors = (runtimeErrors?.[editorId]) || (bundleErrors?.[editorId]);
   const editorRef = useRef();
   const disposerRef = useRef();
   const [settingsOpen] = useState(false);
   const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
   const [isMonacoEditorReady, setIsMonacoEditorReady] = useState(false);
   
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
         
         mountEditorFulfilled(editorId, {
            editorRef, monacoEditorContentChanged,
            isConsole, monacoOptions,
            onEditorContentFirstRender,
           // disposerRef
         });
        // return ()=>disposerRef.current?.();
      },
      [
         monacoEditorContentChanged,
         , isConsole, monacoOptions,
      ]
   );
   useEffect(
      () => {
         return () => updateMonacoEditorLayout(null);
      },
      [updateMonacoEditorLayout]
   );
   
   const notificationType = errors ? 'error' : ''
   const isLoading = !(
      isConsole || (isMonacoEditorReady && firecoPad?.monacoEditor)
   );
   
   return (<div className={classes.container}>
         <div ref={editorRef}
              className={classes.editor}
         />
         {observeLiveExpressions &&
         <LiveExpressionStore
            editorId={editorId}
            liveExpressionStoreChange={liveExpressionStoreChange}
            firecoPad={firecoPad}
         />
         }
         {errors && <Notification
            type={notificationType}
            onClose={handleClose}
            message={errors}/>}
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
};

export default connect(
   mapStateToProps,
   mapDispatchToProps
)(
   withStyles(styles)(EditorContainer)
);
