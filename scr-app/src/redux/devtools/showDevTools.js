import React from 'react';
import {render} from 'react-dom';
import DevTools from './DevTools';

export default function showDevTools(store) {
  return setTimeout(() => {
    const devtoolsDiv = document.createElement('div');
    devtoolsDiv.id = 'react-devtools-root';
    document.body.appendChild(devtoolsDiv);
    render(
      <DevTools store={store}/>,
      document.getElementById('react-devtools-root')
    );
  }, 100);
}
