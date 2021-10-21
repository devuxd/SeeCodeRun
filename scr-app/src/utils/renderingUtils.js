import hoistNonReactStatic from 'hoist-non-react-statics';
import React, {useState, useRef, useEffect} from 'react';

// Adapted from:
//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
const _requestAnimationFrame = global.requestAnimationFrame ||
   function (handler) {
      return setTimeout(function () {
         handler(Date.now());
      }, 1);
   };

// Adapted from:
//https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API
const _requestIdleCallback = global.requestIdleCallback || function (handler) {
   let startTime = Date.now();
   
   return setTimeout(function () {
      handler({
         didTimeout: false,
         timeRemaining: function () {
            return Math.max(0, 50.0 - (Date.now() - startTime));
         }
      });
   }, 1);
};

const _cancelIdleCallback = global.cancelIdleCallback || function (id) {
   clearTimeout(id);
};

const _cancelAnimationFrame = global.cancelAnimationFrame ||
   _cancelIdleCallback;


export function makeTaskQueue(
   onUpdateCallback, idleCallbackOptions = {timeout: 5000}
) {
   const taskList = [];
   let totalTaskCount = 0;
   let currentTaskNumber = 0;
   let taskHandle = null;
   let statusRefreshScheduled = false;
   
   const handleUpdate = (timestamp) => {
      onUpdateCallback(
         taskHandle, currentTaskNumber, totalTaskCount, timestamp
      );
      statusRefreshScheduled = false;
   };
   
   const scheduleStatusRefresh = () => {
      if (!statusRefreshScheduled) {
         _requestAnimationFrame(handleUpdate);
         statusRefreshScheduled = true;
      }
   };
   
   const enqueueTask = (task) =>{
      taskList.push(task);
      
      totalTaskCount++;
      
      if (!taskHandle) {
         taskHandle = _requestIdleCallback(runTaskQueue, idleCallbackOptions);
      }
      
      scheduleStatusRefresh();
   };
   
   const runTaskQueue =(deadline) =>{
      while ((deadline.timeRemaining() > 0 || deadline.didTimeout) &&
      taskList.length) {
         let task = taskList.shift();
         currentTaskNumber++;
         
         task();
         scheduleStatusRefresh();
      }
      
      if (taskList.length) {
         taskHandle = _requestIdleCallback(runTaskQueue, idleCallbackOptions);
      } else {
         taskHandle = 0;
      }
   };
   
   return enqueueTask;
}

// mine:

export function requestAnimationFrameWhenIdle(payloadHandler, handler) {
   return _requestIdleCallback(() => {
      const payload = payloadHandler();
      _requestAnimationFrame((timestamp) => {
         handler(timestamp, payload);
      });
   });
}

// Adapted from:
// https://gist.githubusercontent.com/paularmstrong/cc2ead7e2a0dec37d8b2096fc8d85759/raw/1ce769bb5c27c8ede2dfff11ab20745bc12ce34d/deferComponentRender.js
/**
 * Allows two animation frames to complete to allow other components to update
 * and re-render before mounting and rendering an expensive `WrappedComponent`.
 */
export default function deferComponentRender(WrappedComponent) {
   const DeferredRenderWrapper = (props) => {
      const animationFrameIdRef = useRef();
      const [shouldRender, setShouldRender] = useState(false);
      
      useEffect(
         () => {
            animationFrameIdRef.current = _requestAnimationFrame(() => {
               animationFrameIdRef.current = _requestAnimationFrame(
                  () => setShouldRender(true)
               );
            });
            return () => _cancelAnimationFrame(animationFrameIdRef.current);
         },
         []
      );
      
      return shouldRender && <WrappedComponent {...props} />;
   }
   
   return hoistNonReactStatic(DeferredRenderWrapper, WrappedComponent);
}
