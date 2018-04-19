import 'typeface-roboto';
import 'react-resizable/css/styles.css';
import './utils/react-grid-layout-scr-theme.css';

// import 'rxjs';
import 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/concat';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/throttle';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/zip';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/observable/dom/ajax';

// import 'lodash';

import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker/*,{unregister}*/ from './registerServiceWorker';
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
// unregister();


