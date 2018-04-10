import 'typeface-roboto';
import 'react-resizable/css/styles.css';
import './utils/react-grid-layout-scr-theme.css';
import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker from './registerServiceWorker';
import configureMonaco from './configureMonaco';

import React from 'react';
import ReactDOM from 'react-dom';

import Index from './pages/Index';
import {disposePastebin, fetchPastebin} from './redux/modules/pastebin';
import {loadMonacoFulfilled, loadMonacoRejected} from "./redux/modules/monaco";
import {getLocationUrlData} from "./utils/scrUtils";

const urlData = getLocationUrlData();

const store = configureStore();
store.dispatch(fetchPastebin(urlData.hash));

const onConfigureMonacoError = error => store.dispatch(loadMonacoRejected(error));
const onMonacoConfigured = () => {
  if (window.monaco) {
    store.dispatch(loadMonacoFulfilled());
  } else {
    onConfigureMonacoError('Monaco failed to load. Try refreshing' +
      ' page and/or cache.');
  }
};

window.addEventListener("beforeunload", function () {
  store.dispatch(disposePastebin());
}, false);

configureMonaco(onMonacoConfigured, onConfigureMonacoError);

ReactDOM.render(
  <Provider store={store}>
    <Index url={urlData.url}/>
  </Provider>,
  document.querySelector('#root'));

registerServiceWorker();


