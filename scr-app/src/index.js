import 'typeface-roboto';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker from './registerServiceWorker';
import configureFireco from './configureFireco';

import React from 'react';
import ReactDOM from 'react-dom';

import Index from './pages/Index';
// import {rootSubscriber} from "./redux/modules/root";
import {fetchPastebin} from './redux/modules/pastebin';
import {
  firecoRuntimeError
} from "./redux/modules/fireco";
import {loadMonacoFulfilled} from "./redux/modules/monaco";


const store=configureStore();
store.dispatch(fetchPastebin());

const onFirecoError = error=> store.dispatch(firecoRuntimeError(error));

const onMonacoLoaded=() => {
  if (window.monaco) { // window.monaco is loaded
    store.dispatch(loadMonacoFulfilled(window.monaco));
  } else {
    onFirecoError('Monaco failed to load. Try refreshing' +
      ' page and/or cache.');
  }
};

//will be called only once configuration finishes. An observable fo webWorker
// messages is set in FirecoStore.
const onFirecoWebWorkerMessage=action => {
  store.dispatch(action);
};

configureFireco(onMonacoLoaded, onFirecoWebWorkerMessage, onFirecoError);

window.addEventListener("beforeunload", function () {
  store.dispatch({type: 'DISPOSE_PASTEBIN'});

}, false);

ReactDOM.render(
  <Provider store={store}>
    <Index/>
  </Provider>,
  document.querySelector('#root'));

registerServiceWorker();


