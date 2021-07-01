import React, {
   useCallback,
   useEffect,
   useLayoutEffect,
   useMemo,
   useState
} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/styles';
import Popper from '@material-ui/core/Popper';
import Tooltip from '@material-ui/core/Tooltip';
import {PastebinContext} from './Pastebin';
import GraphicalQuery from '../components/GraphicalQuery';
import {
   FocusBox,
   pulseOutlineAnimation as animation,
   pulseStartOutline
} from "../common/UI";

const styles = () => ({
   locator: {
      ...pulseStartOutline,
      position: 'absolute',
      margin: 0,
      animation,
   },
});

const LocatorTooltip = withStyles((theme) => ({
   tooltip: {
      backgroundColor: 'transparent',
      maxWidth: 'none',
      border: 'none',
      margin: `-${
         theme.spacing(0.5)
      } -${theme.spacing(0.5)} 0 ${theme.spacing(1.25)}`,
      padding: 0,
      lineHeight: 0,
   }
}))
(Tooltip);

const WindowResizeObserver = global.ResizeObserver ||
   console.log('Resize observer not supported!');

const WindowMutationObserver = global.MutationObserver ||
   console.log('Mutation observer not supported!');

function getOverlayStyles(
   elt, containerOffsetTopPos, containerOffsetLeftPos, limit
) {
   const overlays = [];
   const rects = elt.getClientRects();
   const length = rects ? limit ? Math.min(limit, rects.length)
      : rects.length : 0;
   for (let i = 0; i < length; i++) {
      const rect = rects[i] || {};
      const style = {
         overflow: elt.style.overflow || 'unset',
      };
      const width = (rect.width || 0).toFixed(2);
      const height = (rect.height || 0).toFixed(2);
      style.width = `${width}px`;
      style.height = `${height}px`;
      style.marginLeft = `-${width}px`;
      style.marginTop = `-${height}px`;
      overlays.push(style);
   }
   return overlays;
}

// function handleClose({...p}) {
//     console.log('gm', ...p)
// }

const GraphicalLocator = ({
                             id,
                             observeResizes = true,
                             observeMutations = false,
                             mutationObserverOptions = {
                                attributes: true,
                                childList: false,
                                subtree: false
                             },
                             getStyle,
                             domEl,
                             containerRef,
                             isSelected,
                             classes,
                             TooltipProps = {
                                enterDelay: 100,
                                enterNextDelay: 100,
                                leaveDelay: 100
                             },
                          }) => {
   const [style, setStyle] = useState(getStyle);
   const onResize = useCallback((/*entry*/) => {
      setStyle(getStyle());
   }, [setStyle, getStyle]);
   const [resizeObserver] = useState(
      () => (observeResizes && WindowResizeObserver &&
         new WindowResizeObserver(onResize))
   );
   const [mutationObserver] = useState(
      () => (observeMutations && WindowMutationObserver &&
         new WindowMutationObserver(onResize))
   );
   useEffect(() => {
         resizeObserver && resizeObserver.observe(domEl);
         mutationObserver && mutationObserver.observe(
            domEl,
            mutationObserverOptions
         );
         return (() => {
               resizeObserver && resizeObserver.unobserve(domEl);
               mutationObserver && mutationObserver.disconnect();
            }
         );
      },
      [resizeObserver, mutationObserver, mutationObserverOptions, domEl]
   );
   const clientRect =
      containerRef.current.getBoundingClientRect();
   const containerOffsetTopPos = clientRect.y;
   const containerOffsetLeftPos = clientRect.x;
   
   const popperModifiers = useMemo(() => (
      [
         {
            name: 'offset',
            options: {
               offset: [
                  containerOffsetLeftPos,
                  containerOffsetTopPos
               ],
            },
         },
         {
            name: 'flip',
            enabled: false,
         },
         {
            name: 'preventOverflow',
            enabled: true,
            options: {
               boundary: containerRef.current,
            }
         },
         {
            name: 'hide',
            enabled: true,
         },
         {
            name: 'arrow',
            enabled: false,
            // element: arrowRef,
         },
      ]
   ), [
      containerOffsetLeftPos,
      containerOffsetTopPos,
      containerRef
   ]);
   
   return (
      <LocatorTooltip
         key={`${isSelected}`}
         title={
            // <BranchNavigator
            //     min={1}
            //     max={key}
            //     value={1}
            //     handleSliderChange={()=>1}
            //     // color={color}
            //     // onMouseEnter={this.onMouseEnter}
            //     // onMouseLeave={this.onMouseLeave}
            // />
            <GraphicalQuery
               outputRefs={[domEl]}
               visualIds={[id]}
               selected={!!isSelected}
            />
         }
         placement="bottom-end"
         {...(isSelected ? {disableInteractive: true, open: true} : {})}
         {...TooltipProps}
      >
         <Popper
            placement="bottom-end"
            disablePortal={false}
            modifiers={popperModifiers}
            anchorEl={domEl || {}}
            container={containerRef.current}
            open={true}
         >
            <div
               className={classes.locator}
               style={style}
            
            >
               <FocusBox
                  variant={isSelected ? 'Triangle' : 'Line'}
               />
            </div>
         </Popper>
      
      </LocatorTooltip>
   )
};

const GraphicalMapper = (({
                             classes,
                             isGraphicalLocatorActive,
                             visualElements,
                             containerRef,
                             handleChangeGraphicalLocator,
                             searchState,
                             VisualQueryManager
                          }) => {
   VisualQueryManager.visualElements = visualElements;
   
   const {visualQuery} = searchState;
   const portalEl = useMemo(
      () => document.createElement('div'),
      []
   );
   useLayoutEffect(() => {
      document.body.appendChild(portalEl);
      return () => document.body.removeChild(portalEl);
   }, [portalEl]);
   
   const handleClose = useCallback(() => {
         isGraphicalLocatorActive && handleChangeGraphicalLocator();
      }
      , [handleChangeGraphicalLocator, isGraphicalLocatorActive]);
   
   const locators = useMemo(() => {
         const locatedEls = [];
         
         visualElements.forEach((domEl, key) => {
            if (!domEl || domEl.tagName === 'STYLE') {
               return;
            }
            const isSelected =
               VisualQueryManager.isGraphicalElementSelected(
                  domEl, visualQuery
               );
            
            if (!domEl.getClientRects && domEl?.body) { // is document
               domEl = domEl.body;
            }
            
            if (!isGraphicalLocatorActive && !isSelected) {
               return;
            }
            
            // const box = domEl.getBoundingClientRect();
            //todo: show them on the side?
            // let hidden = domEl.style
            //     && (domEl.style.visibility === 'hidden'
            //         || domEl.style.display === 'none'
            //         || (
            //             box &&
            //             box.top === 0 &&
            //             box.left === 0 &&
            //             box.right === 0 &&
            //             box.bottom === 0
            //         )
            //     );
            
            const getStyle = () => {
               const clientRect =
                  containerRef.current.getBoundingClientRect();
               const containerOffsetTopPos = clientRect.y;
               const containerOffsetLeftPos = clientRect.x;
               const overlayStyles = getOverlayStyles(
                  domEl,
                  containerOffsetTopPos,
                  containerOffsetLeftPos,
                  1
               );
               
               return overlayStyles[0];
            };
            
            locatedEls.push(
               <GraphicalLocator
                  key={key}
                  {...{
                     id: key,
                     getStyle,
                     domEl,
                     containerRef,
                     isSelected,
                     classes,
                  }}
               />
            );
            
         });
         return locatedEls;
      }
      , [
         visualQuery,
         visualElements,
         isGraphicalLocatorActive,
         containerRef,
         classes,
      ]);
   
   return ReactDOM.createPortal(
      <div
         onClick={handleClose}
      >
         {locators}
      </div>,
      portalEl
   );
   
});

GraphicalMapper.propTypes = {
   visualElements: PropTypes.array.isRequired,
};

const GraphicalMapperWithContext = props => (
   <PastebinContext.Consumer>
      {(context) => {
         return <GraphicalMapper {...props} {...context}/>
      }}
   </PastebinContext.Consumer>
);

export default withStyles(styles)(GraphicalMapperWithContext);
