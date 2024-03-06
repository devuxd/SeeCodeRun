import {useState, useCallback, useEffect, useMemo, useRef} from 'react';

// import {
//     activate as activateBackend,
//     initialize as initializeBackend
// } from 'react-devtools-inline/backend';
// import {initialize as initializeFrontend} from 'react-devtools-inline/frontend';

import {Resizable} from 'react-resizable';
import {useResizeDetector} from 'react-resize-detector';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

const sandboxAttributeValue = [
    'allow-forms',
    'allow-modals',
    'allow-orientation-lock',
    'allow-pointer-lock',
    'allow-popups',
    'allow-popups-to-escape-sandbox',
    'allow-presentation',
    'allow-same-origin',
    'allow-scripts',
    'allow-top-navigation',
    'allow-top-navigation-by-user-activation',
].join(' ');

const iframeStyle = [
    'overflow: auto',
    'height: 100%',
    'width: 100%',
    'margin: 0',
    'padding: 0',
    'border: 0',
].join("; ");

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

    // const [state, setState] = useState(0);
    // const changeState = useCallback(() => setState(state => state++), [setState]);

    return useMemo(() => {
            const removeIframe = () => {
                let removed = false;
                if (playgroundRef.current?.contains(iFrameRef.current)) {
                    playgroundRef.current.removeChild(iFrameRef.current);
                    removed = true;
                }
                iFrameRef.current = null;
                iFrameStateRef.current.loaded = false;
                return removed;
            };

            const appendScriptToIFrameBody = (script) => {
                console.log("iframeDoc script", script);
                const iframe =  iFrameRef.current;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const doc = iframeDoc;
                console.log("iframeDoc", iframeDoc);
                // const doc = iFrameRef.current.contentDocument ?? document;
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

            const createIframe = (id = "scr.runIframe") => {
                const runIframe = documentObj.createElement('iframe');
                runIframe.id = id;
                runIframe.sandbox = sandboxAttributeValue;
                runIframe.style = iframeStyle;
                // console.log("scr.runIframe", runIframe);
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
                        removeIframe();
                        playgroundRef.current.appendChild(newIFrameRefCurrent);
                        iFrameRef.current = newIFrameRefCurrent;
                        const DevTools = null;

//                         // The React app you want to inspect with DevTools is running within this iframe:
//                         const iframe = newIFrameRefCurrent;// document.getElementById('target');
//                         const {contentWindow} = iframe;
//
// // Installs the global hook into the iframe.
// // This must be called before React is loaded into that frame.
//                         initializeBackend(contentWindow);
//
//                         // Initialize DevTools UI to listen to the hook we just installed.
// // This returns a React component we can render anywhere in the parent window.
// // This also must be called before React is loaded into the iframe
//                         const DevTools = initializeFrontend(contentWindow);
//
// // React application can be injected into <iframe> at any time now...
// // Note that this would need to be done via <script> tag injection,
// // as setting the src of the <iframe> would load a new page (without the injected backend).
//
// // <DevTools /> interface can be rendered in the parent window at any time now...
// // Be sure to use ReactDOMClient.createRoot() to render this component.
//
// // Let the backend know the frontend is ready and listening.
//                         activateBackend(contentWindow);
                        // console.log({DevTools});
                        return [true, DevTools];
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
    onOverflow,
    containerRef,
    onResize,
    handleOverflowWidth,
    handleOverflowHeight
) => {
    const rRef = useRef();
    const _containerRef = useRef();
    containerRef = containerRef ?? _containerRef;
    const _onResize = useCallback(
        (...params) => {
            onResize?.(...params);
            onOverflow?.(
                isOverflowed(
                    rRef.current,
                    containerRef,
                    handleOverflowWidth,
                    handleOverflowHeight
                )
            );
        },
        [
            onResize,
            containerRef,
            onOverflow,
            handleOverflowWidth,
            handleOverflowHeight
        ]
    );

    const props = useMemo(() => ({
        onResize: _onResize,
        onOverflow
    }), [_onResize, onOverflow]);

    const detectorProps = useResizeDetector(props);
    detectorProps.containerRef = containerRef;
    rRef.current = detectorProps.ref;

    return detectorProps;
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
