import {useRef, useEffect} from 'react';

export const usePrevious = (value, ref)=> {
    const _ref = useRef(ref);
    useEffect(() => {
        _ref.current = value;
    }, [value]);
    return _ref.current;
};