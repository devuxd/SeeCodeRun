import 'typeface-roboto';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker from './registerServiceWorker';

import React from 'react';
import ReactDOM from 'react-dom';

import Index from './pages/Index';
import {rootSubscriber} from "./redux/modules/root";
import {fetchPastebin} from './redux/modules/pastebin';
import {loadMonacoFulfilled, loadMonacoRejected} from "./redux/modules/monaco";
import {configureFirecoWorkerFulfilled} from "./redux/modules/fireco";

const store = configureStore();

const errorTypeMessages = {
  'UNCAUGHT': 'Some files were not loaded, please check your internet connection.',
  'WEB_WORKER': 'Browser is not compatible with seeCode.Run, it requires web workers.',
  'MONACO_LOAD_TIMEOUT': 'Monaco Loading Timeout.',
  'MONACO_LOAD_LOCAL_SCRIPT': 'Some files were not loaded, please check your internet connection.',
  'FIRECO_WEB_WORKER_LOAD_TIMEOUT': 'Some files were not loaded, please check your internet connection.'
};
const configureScrLoaderListener = ()=>{
  if (window.scr) { // assigned in index.html's head
    if(window.scr.error){
      store.dispatch({type:window.scr.errorType, error:{description: errorTypeMessages[window.scr.errorType], details:window.scr.error}});
      return;
    }
    window.scr.onMonacoLoaded((monaco, error) => {
      if (monaco) { // window.monaco is loaded
        store.dispatch(loadMonacoFulfilled(monaco));
        return;
      }
      store.dispatch(loadMonacoRejected(error));
    });
    store.dispatch(configureFirecoWorkerFulfilled(window.scr.firecoWorker));
  }
};

store.dispatch(fetchPastebin());

configureScrLoaderListener();

const rootUnsubscribe = rootSubscriber(store);
window.addEventListener("beforeunload", function () {
  store.dispatch({type: 'DISPOSE_PASTEBIN'});
  rootUnsubscribe();
}, false);

ReactDOM.render(
  <Provider store={store}>
    <Index/>
  </Provider>,
  document.querySelector('#root'));

registerServiceWorker();


