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

export const useLodashThrocer = (
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