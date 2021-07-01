import React from 'react';
import { createDevTools } from '@redux-devtools/core';
import LogMonitor from '@redux-devtools/log-monitor';
import SliderMonitor from '@redux-devtools/slider-monitor';
import DockMonitor from '@redux-devtools/dock-monitor';

export default createDevTools(
   <DockMonitor changeMonitorKey="ctrl-m"
                toggleVisibilityKey='ctrl-h'
                changePositionKey='ctrl-q'
                defaultIsVisible={false}>
      <LogMonitor theme='tomorrow'
                  expandStateRoot={false}
                  markStateDiff={false}
                  expandActionRoot={false}
                  hideMainButtons={true}
      />
      <SliderMonitor />
   </DockMonitor>
);
