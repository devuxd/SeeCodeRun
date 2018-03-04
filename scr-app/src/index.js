import 'typeface-roboto';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker from './registerServiceWorker';
import configureMonaco from './configureMonaco';

import React from 'react';
import ReactDOM from 'react-dom';

import Index from './pages/Index';
import {fetchPastebin} from './redux/modules/pastebin';
import {loadMonacoFulfilled, loadMonacoRejected} from "./redux/modules/monaco";

const store=configureStore();
store.dispatch(
  fetchPastebin(
    window.location.hash.replace(/#/g, '') || ''
  )
);

const onConfigureError=error => store.dispatch(loadMonacoRejected(error));
const onMonacoConfigured=() => {
  if (window.monaco) { // window.monaco is loaded
    store.dispatch(loadMonacoFulfilled());
  } else {
    onConfigureError('Monaco failed to load. Try refreshing' +
      ' page and/or cache.');
  }
};

window.addEventListener("beforeunload", function () {
  store.dispatch({type: 'DISPOSE_PASTEBIN'});
}, false);

configureMonaco(onMonacoConfigured, onConfigureError);

ReactDOM.render(
  <Provider store={store}>
    <Index/>
  </Provider>,
  document.querySelector('#root'));

registerServiceWorker();


