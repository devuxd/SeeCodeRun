import 'react-resizable/css/styles.css';
import './utils/react-grid-layout-scr-theme.css';

import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import registerServiceWorker/*,{unregister}*/ from './registerServiceWorker';
import configureMonacoDefaults from './configureMonaco';

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
const onMonacoConfigured = monaco => {
    if (monaco) {
        store.dispatch(loadMonacoFulfilled(monaco));
    } else {
        onConfigureMonacoError('Monaco failed to load. Try refreshing' +
            ' page and/or cache.');
    }
};

window.addEventListener("beforeunload", function () {
    store.dispatch(disposePastebin());
}, false);

ReactDOM.render(
    <Provider store={store}>
        <Index url={urlData.url}/>
    </Provider>,
    document.querySelector('#root'));

const monacoPromise = async () => await import ('monaco-editor');
monacoPromise().then(monaco => {
    global.monaco = monaco;
    configureMonacoDefaults(monaco);
    onMonacoConfigured(monaco);
});

registerServiceWorker();
// unregister();


