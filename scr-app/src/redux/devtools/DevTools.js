import React from 'react';
// Exported from redux-devtools
import {createDevTools} from 'redux-devtools';

// Monitors are separate packages, and you can make a custom one

import DockMonitor from 'redux-devtools-dock-monitor';
import LogMonitor from 'redux-devtools-log-monitor'; //
import FilterableLogMonitor
from 'redux-devtools-filterable-log-monitor';//<FilterableLogMonitor />

// createDevTools takes a monitor and produces a DevTools component
const DevTools = createDevTools(
  // Monitors are individually adjustable with props.
  // Consult their repositories to learn about those props.
  // Here, we put LogMonitor inside a DockMonitor.
  // Note: DockMonitor is visible by default.
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
    <FilterableLogMonitor />
  </DockMonitor>
);

export default DevTools;
