import {
   memo,
   forwardRef,
   useRef,
   useState,
   useEffect
} from 'react';
import PropTypes from 'prop-types';

const SizeProvider = (Component) => {
   const SizeProvider = memo(forwardRef((
      {
         measureBeforeMount = false,
         onHeight,
         onWidth,
         debounceTime = 500,
         initialHeight = 1024,
         initialWidth = 1280,
         aWindow = window, // support for iframe
         ...props
      },
      ref
   ) => {
      const reactRef = useRef();
      const [height, setHeight] = useState(initialHeight);
      const [width, setWidth] = useState(initialWidth);
      
      const [mounted, setMounted] = useState(!measureBeforeMount);
      
      useEffect(
         () => {
            setMounted(true);
            return () => null;
         },
         []
      );
      
      useEffect(
         () => {
            const onWindowResize = () => {
               const node = reactRef.current;
               
               if (!(node instanceof HTMLElement)) {
                  return;
               }
               
               setHeight(
                  (onHeight?.(node) ?? node.offsetHeight)
                  ?? aWindow.innerHeight
               );
               
               setWidth(
                  (onWidth?.(node) ?? node.offsetWidth)
                  ?? aWindow.innerWidth
               );
               
            };
            
            onWindowResize();
            
            let tid = null;
            const _onWindowResize = () => {
               aWindow.clearTimeout(tid);
               tid = aWindow.setTimeout(onWindowResize, debounceTime);
            };
            
            aWindow.addEventListener('resize', _onWindowResize);
            
            return () => {
               aWindow.clearTimeout(tid);
               aWindow.removeEventListener('resize', _onWindowResize);
            };
            
         },
         [aWindow, onHeight, onWidth, debounceTime]
      );
      
      return (
         mounted ?
            <div ref={reactRef}>
               <Component
                  height={height}
                  width={width}
                  ref={ref}
                  {...props}
               />
            </div>
            : <div
               ref={reactRef}
               className={props.className}
               style={props.style}
            />
      );
   }));
   
   SizeProvider.propTypes = {
      measureBeforeMount: PropTypes.bool,
      onHeight: PropTypes.func,
      onWidth: PropTypes.func,
      debounceTime: PropTypes.number,
      initialHeight: PropTypes.number,
      initialWidth: PropTypes.number,
      aWindow: PropTypes.object,
   };
   
   SizeProvider.displayName = "SizeProvider";
   
   return SizeProvider;
};

export default SizeProvider;
