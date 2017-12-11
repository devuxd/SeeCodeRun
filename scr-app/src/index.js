import 'typeface-roboto';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import 'rxjs';
import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker from './registerServiceWorker';

import React from 'react';
import {render} from 'react-dom';

import Index from './pages/Index';
import {rootSubscriber} from "./redux/modules/root";
import {fetchPastebin} from './redux/modules/pastebin';

const store = configureStore();

window.reduxStore = store;

const rootUnsubscribe = rootSubscriber(store);

window.addEventListener("beforeunload", function () {
  store.dispatch({type: 'DISPOSE_PASTEBIN'});
  rootUnsubscribe();
}, false);

store.dispatch(fetchPastebin());

render(
  <Provider store={store}>
    <Index/>
  </Provider>,
  document.querySelector('#root'));

registerServiceWorker();
