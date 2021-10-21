import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function withMediaQuery(Component) {
    return function WithMediaQuery(props) {
        const mediaQuery = `${props.mediaQuery || ''}`;
        const options = props.mediaQueryOptions||{};
        let mediaQueryResult = useMediaQuery(mediaQuery, options);
        mediaQueryResult = mediaQuery ? mediaQueryResult : undefined;
        return <Component mediaQueryResult={mediaQueryResult} {...props} />;
    }
}
