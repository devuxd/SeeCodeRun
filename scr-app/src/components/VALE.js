


import React from 'react';

import Portal from '@material-ui/core/Portal';
import ObjectExplorer, {
   ExplorerTooltip,
   ExplorerTooltipContainer,
   ObjectRootLabel
} from "./ObjectExplorer";

import GraphicalQuery from "./GraphicalQuery";

export default function VALE(
   {
      visible,
      container,
      isOmitLabel,
      showTooltip,
      objectNodeRenderer,
      isOutput,
      value,
      isIcon,
      expressionType,
      expressionId,
      selected,
      outputRefs,
      getVisualIdsFromRefs,
      cacheId,
      onChange
   }
) {
   
   
   return <Portal container={container}>
      {visible && (isOmitLabel ? null :
         <ExplorerTooltip
            key={showTooltip}
            placement="bottom-start"
            {...(showTooltip ? {} : {open: false})}
            title={
               <ExplorerTooltipContainer>
                  <ObjectExplorer
                     cacheId={cacheId}
                     expressionId={expressionId}
                     objectNodeRenderer={objectNodeRenderer}
                     data={value}
                     handleChange={onChange}
                     outputRefs={outputRefs}
                  />
               </ExplorerTooltipContainer>
            }
         >
            {isOutput ?
               <GraphicalQuery
                  outputRefs={outputRefs}
                  visualIds={
                     getVisualIdsFromRefs(
                        outputRefs
                     )
                  }
                  selected={selected}
               />
               :
               <ObjectRootLabel
                  data={value}
                  compact={true}
                  expressionType={expressionType}
                  iconify={isIcon}
               />
            }
         </ExplorerTooltip>)
      }
   </Portal>
}
