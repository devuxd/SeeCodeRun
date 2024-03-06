import {useRef, useEffect, createContext, useContext, useMemo, useCallback} from 'react';
import {BehaviorSubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

export function useAnimationFrameCallback(
    domEl,
    onAnimationFrame,
    observeResizes = true,
    observeMutations = false,
    maxResizeTimeOutMs = 3000,
) {

    const ridRef = useRef(null);
    return useCallback((/*entry*/) => {
        if (!onAnimationFrame) {
            return;
        }
        ridRef.current ??= {};
        cancelAnimationFrame(ridRef.current.id);
        ridRef.current.id = requestAnimationFrame((timeStamp) => {
            ridRef.current.start ??= timeStamp;
            const elapsed = timeStamp - ridRef.current.start;
            if (elapsed > maxResizeTimeOutMs) {
                ridRef.current.start = null;
                onAnimationFrame();
            }
        });

    }, [onAnimationFrame, maxResizeTimeOutMs]);
}

const ObserverContext = createContext({
    setObserversForElement: () => {
    },
    cleanupObservers: () => {
    },
    cleanupAll: () => {
    },
});

export const DOMObserverProvider = ({children, onResizeError, onMutationError}) => {
    const observersRef = useRef(new Map());
    const errorHandlersRef = useRef({onResizeError, onMutationError});

    useEffect(() => {
        errorHandlersRef.current = {onResizeError, onMutationError};
    }, [onResizeError, onMutationError]);

    const setObserversForElement = useCallback((domEl, mutationObserverOptions = defaultMutationObserverOptions) => {
        if (!observersRef.current.has(domEl)) {
            const subject = new BehaviorSubject(null);

            let isResizing = false; // Flag to prevent handling resize events during certain conditions

            const resizeObserver = new ResizeObserver(entries => {
                if (isResizing) return; // Skip if resizing is already being handled
                try {
                    isResizing = true; // Set flag before handling resize to prevent further triggers
                    subject.next({type: 'resize', entries});
                } catch (error) {
                    if (typeof errorHandlersRef.current.onResizeError === 'function') {
                        errorHandlersRef.current.onResizeError(error, domEl);
                    }
                } finally {
                    isResizing = false; // Reset flag after handling resize
                }
            });

            const mutationObserver = new MutationObserver(mutations => {
                try {
                    subject.next({type: 'mutation', mutations});
                } catch (error) {
                    if (typeof errorHandlersRef.current.onMutationError === 'function') {
                        errorHandlersRef.current.onMutationError(error, domEl);
                    }
                }
            });

            resizeObserver.observe(domEl);
            mutationObserver.observe(domEl, mutationObserverOptions);

            observersRef.current.set(domEl, {subject, resizeObserver, mutationObserver});
        }

        return observersRef.current.get(domEl).subject;
    }, []);

    const cleanupObservers = useCallback((domEl) => {
        const observers = observersRef.current.get(domEl);
        if (observers) {
            observers.subject.complete();
            observers.resizeObserver.unobserve(domEl);
            observers.mutationObserver.disconnect();
            observersRef.current.delete(domEl);
        }
    }, []);

    const cleanupAll = useCallback(() => {
        observersRef.current.forEach((_, domEl) => {
            cleanupObservers(domEl);
        });
    }, [cleanupObservers]);

    const providerValue = useMemo(() => ({
        setObserversForElement,
        cleanupObservers,
        cleanupAll
    }), [setObserversForElement, cleanupObservers, cleanupAll]);

    useEffect(() => {
        // Cleanup when the provider is unmounted
        return cleanupAll;
    }, [cleanupAll]);

    return (
        <ObserverContext.Provider value={providerValue}>
            {children}
        </ObserverContext.Provider>
    );
};

const defaultPipelineRx = debounceTime(300);
const defaultMutationObserverOptions = {
    attributes: true,
    childList: false,
    subtree: false
};


export const useDOMObserverEffect = (domEl, onDOMChange, pipelineRx = defaultPipelineRx, mutationObserverOptions = defaultMutationObserverOptions, onError) => {
    const {setObserversForElement} = useContext(ObserverContext);
    const onAnimationFrame = useAnimationFrameCallback(domEl, onDOMChange);

    useEffect(() => {
        if (!domEl || !setObserversForElement) return;

        const subject = setObserversForElement(domEl, mutationObserverOptions);

        const subscription = subject.pipe(pipelineRx).subscribe({
            next: onAnimationFrame,
            error: onError // Pass the onError callback to handle potential errors.
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [domEl, onAnimationFrame, pipelineRx, setObserversForElement, onError]);
};
