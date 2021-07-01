import {useCallback, useEffect, useMemo, useRef} from 'react';
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
}
