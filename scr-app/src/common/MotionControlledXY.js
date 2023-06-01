import React, {
   forwardRef,
   useMemo,
} from 'react';

import {motion, useMotionValue} from 'framer-motion';

const MotionControlledXY = forwardRef((
   {
      element = "div",
      initialX = 0,
      initialY = 0,
      style,
      styleRef,
      ...props
   },
   ref
) => {
   const _x = useMotionValue(initialX);
   const _y = useMotionValue(initialY);
   
   const _style = useMemo(
      () => {
         let _style = {x: _x, y: _y};
         _style = style ? {...style, ..._style} : _style;
         
         if (styleRef) {
            styleRef.current = _style;
         }
         
         return _style;
      },
      [_x, _y, style, styleRef]
   );
   
   const MotionElement = useMemo(
      () => {
         return motion[element];
      },
      [element]
   );
   
   return <MotionElement style={_style} ref={ref} {...props} />;
});

export default MotionControlledXY;
