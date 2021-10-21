import {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {Resizable} from 'react-resizable';
import {useResizeDetector} from 'react-resize-detector';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

export const usePrevious = (value, ref) => {
   const _ref = useRef(null);
   const _ref_ = ref || _ref;
   useEffect(
      () => {
         _ref_.current = value;
      },
      [value]
   );
   return _ref_.current;
};

const defaultThrottleOptions = {
   leading: true,
   trailing: false,
};

const defaultDebounceOptions = {
   leading: false,
   trailing: true,
   // maxWait: 1000,
};

export const useLodashThrocer = ( // deprecated: _ does it via maxWait
   throttledCallback,
   debounceCallback,
   throttleWait = 500,
   throttleOptions = defaultThrottleOptions,
   debounceWait = 1000,
   debounceOptions = defaultDebounceOptions,
) => {
   
   const debounced = useMemo(
      () => debounce(
         debounceCallback,
         debounceWait,
         debounceOptions
      ),
      [debounceCallback, debounceWait, debounceOptions]
   );
   
   const throttled = useMemo(
      () => throttle(
         throttledCallback,
         throttleWait,
         throttleOptions
      ),
      [throttledCallback, throttleWait, throttleOptions]
   );
   
   const refs = useRef({});
   refs.current.funcs = {debounced, throttled};
   
   useEffect(
      () => {
         refs.current.cancel = () => {
            const {debounced, throttled} = refs.current.funcs;
            throttled.cancel();
            debounced.cancel();
         };
         
         return refs.current.cancel;
      },
      []
   );
   
   return useCallback(
      (...params) => {
         throttled(...params);
         debounced(...params);
         return refs.current;
      },
      [debounced, throttled]
   );
};

export const useSandboxIFrameHandler = (documentObj, prepareIframe) => {
   const playgroundRef = useRef();
   const iFrameRef = useRef();
   const iFrameStateRef = useRef({
      loaded: false,
      pendingScript: null,
   });
   
   return useMemo(() => {
         const removeIframe = () => {
            if (playgroundRef.current && iFrameRef.current) {
               playgroundRef.current.removeChild(iFrameRef.current);
               iFrameRef.current = null;
               iFrameStateRef.current.loaded = false;
               return true;
            }
            return false;
         };
         
         const appendScriptToIFrameBody = (script) => {
            const doc = iFrameRef.current.contentDocument ?? document;
            if (!iFrameStateRef.current.loaded) {
               iFrameStateRef.current.pendingScript = script;
               return;
            }
            const scriptEl = doc.createElement(
               "script"
            );
            scriptEl.type = 'text/javascript';
            scriptEl.text = script;
            // scriptEl.text = 'console.log(this);';
            doc.body.appendChild(scriptEl);
            // console.log(script, scriptEl);
         };
         
         const createIframe = () => {
            removeIframe();
            const runIframe = documentObj.createElement('iframe');
            runIframe.sandbox =
               'allow-forms' +
               ' allow-popups' +
               ' allow-scripts' +
               ' allow-same-origin' +
               ' allow-modals';
            runIframe.style =
               'overflow: auto;' +
               ' height: 100%;' +
               ' width: 100%;' +
               ' margin: 0;' +
               ' padding: 0;' +
               ' border: 0;';
            runIframe.addEventListener('load', () => {
               iFrameStateRef.current.loaded = true;
               if (iFrameStateRef.current.pendingScript) {
                  appendScriptToIFrameBody(
                     iFrameStateRef.current.pendingScript
                  );
                  iFrameStateRef.current.pendingScript = null;
               }
            });
            return prepareIframe ? prepareIframe(runIframe) : prepareIframe;
         };
         
         return ([
            playgroundRef,
            {
               iFrameRef,
               iFrameStateRef,
               removeIframe,
               createIframe,
               appendIframe: () => {
                  if (!playgroundRef.current) {
                     return false;
                  }
                  const newIFrameRefCurrent = createIframe();
                  playgroundRef.current.appendChild(newIFrameRefCurrent);
                  iFrameRef.current = newIFrameRefCurrent;
                  return true;
               },
               getIframe: () => iFrameRef.current,
               appendScriptToIFrameBody,
            }])
      },
      [documentObj, prepareIframe]
   );
};

export const isOverflowed = (
   ref,
   containerRef,
   handleOverflowWidth = true,
   handleOverflowHeight = true,
   overflowThresholdX = 2,
   overflowThresholdY = 2
) => {
   if (!ref?.current || !containerRef?.current) {
      return false;
   }
   
   return (
      (handleOverflowWidth &&
         ref.current.offsetWidth - overflowThresholdX > containerRef.current.offsetWidth) ||
      (handleOverflowHeight &&
         ref.current.offsetHeight - overflowThresholdY > containerRef.current.offsetHeight)
   );
};

export const useResizeAndOverflowDetector = (
   {
      containerRef,
      onResize,
      onOverflow,
      handleOverflowWidth,
      handleOverflowHeight,
      ...resizeDetectorOptions
   } = {}
) => {
   let ref = null;
   const _containerRef = useRef();
   containerRef = containerRef ?? _containerRef;
   const _onResize = useCallback(
      (...params) => {
         onResize && onResize(...params);
         onOverflow &&
         onOverflow(
            isOverflowed(
               ref,
               containerRef,
               handleOverflowWidth,
               handleOverflowHeight
            )
         );
      },
      [
         ref,
         onResize,
         containerRef,
         onOverflow,
         handleOverflowWidth,
         handleOverflowHeight
      ]
   );
   
   const detectorProps = useResizeDetector({
      onResize: _onResize,
      ...resizeDetectorOptions
   });
   ref = detectorProps.ref;
   
   return {...detectorProps, containerRef};
};

export const useMeasureBeforeMount = (
   {
      disableMeasureBeforeMount = false,
      initialMeasurements = {width: 0, height: 0},
      ref: beforeMountRef,
   } = {}
) => {
   const [isMounted, setIsMounted] = useState(disableMeasureBeforeMount);
   const [measurements, setMeasurements] = useState(initialMeasurements);
   const _beforeMountRef = useRef();
   const ref = beforeMountRef ?? _beforeMountRef;
   useEffect(
      () => {
         if (isMounted || !ref.current) {
            return;
         }
         const newMeasurements = {};
         const rect = ref.current.getBoundingClientRect?.() ?? {};
         for (let key in rect) {
            if (typeof rect[key] === 'function') {
               continue;
            }
            newMeasurements[key] = rect[key];
         }
         setMeasurements(measurements => ({
            ...measurements,
            ...newMeasurements
         }));
         setIsMounted(true);
      },
      [ref, isMounted]
   );
   
   return {isMounted, ref, ...measurements};
};

const baseHandleStyle = {
   position: "absolute",
   backgroundColor: "transparent",
   zIndex: 2000,
};

const defaultRowHandleStyle = {
   ...baseHandleStyle,
   cursor: "ns-resize",
   bottom: 0,
   marginBottom: 0,
   left: 0,
   height: 2,
   width: "100%",
};

const defaultColumnHandleStyle = {
   ...baseHandleStyle,
   cursor: "ew-resize",
   top: 0,
   right: 0,
   marginRight: 0,
   width: 2,
   height: "100%",
};


const defaultStyle = {
   position: "relative",
   height: 200,
   width: 200,
};

const handle = (handle, ref) => {
   const style =
      handle === "e" || handle === "se" ?
         defaultColumnHandleStyle
         : handle === "s" ?
            defaultRowHandleStyle : {};
   return (<div
      ref={ref}
      style={style}
   />);
};

const defaultResizableProps = {
   axis: "x",
   resizeHandles: ["e"],
   handle,
};

export const resizableAcceptor = WrappedComponent => (
   {
      ResizableProps = defaultResizableProps,
      style: _style = defaultStyle,
      ...props
   }
) => {
   
   const [style, setStyle] = useState(_style);
   
   const onResize = useCallback(
      (event, {size, handle/*,element*/}) => {
         setStyle(style => ({
            ...style,
            height: handle === "s" ? size.height : style.height,
            width: (handle === "e" || handle === "se") ? size.width : style.width,
         }));
      }, []);
   
   return <Resizable
      {...ResizableProps}
      height={style.height}
      width={style.width}
      onResize={onResize}
   >
      <div
         style={style}
      >
         <WrappedComponent
            {...props}
         />
      </div>
   </Resizable>;
};
