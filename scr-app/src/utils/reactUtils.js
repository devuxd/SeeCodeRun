import {useRef, useEffect, useState} from 'react';

export const usePrevious = (value, ref) => {
    const _ref = useRef(ref);
    useEffect(() => {
        _ref.current = value;
    }, [value]);
    return _ref.current;
};

export const useLodashDelayable = (
    lodashDelayable, functionToDelay, wait, options
) => {
    const [delayable, setDelayable] = useState(() => {
        return lodashDelayable(
            functionToDelay,
            wait,
            options
        );
    });

    return [delayable, (
        _lodashDelayable = lodashDelayable,
        _functionToDelay = functionToDelay,
        _wait = wait,
        _options = options
    ) => {
        delayable && delayable.cancel();
        setDelayable(_lodashDelayable(
            _functionToDelay,
            _wait,
            _options
        ));
    }];
};