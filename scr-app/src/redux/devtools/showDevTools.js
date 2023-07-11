import React from 'react';
// import {render} from 'react-dom';
import {createRoot} from 'react-dom/client';
import DevTools from './DevTools';

/**
 * Renders Redux Dev tools
 * @param {Object} store - the Redux store to be debugged.
 * @return {number} - The timeout id in case of cancellation.
 */
export default function showDevTools(store) {
  return setTimeout(() => {
    const devtoolsDiv = document.createElement('div');
    devtoolsDiv.id = 'react-devtools-root';
    document.body.appendChild(devtoolsDiv);
    const root = createRoot(devtoolsDiv);
    root.render(
        <DevTools store={store}/>
        // ,
        // document.querySelector('#react-devtools-root')
    );
    // render(
    //   <DevTools store={store}/>,
    //   document.querySelector('#react-devtools-root')
    // );
  }, 100);
}
