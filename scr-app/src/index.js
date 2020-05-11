import 'react-resizable/css/styles.css';
import './utils/react-grid-layout-scr-theme.css';

import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import * as serviceWorker from './serviceWorker';
import configureMonacoDefaults from './configureMonaco';

import React from 'react';
import ReactDOM from 'react-dom';
import Index from './pages/Index';
import {disposePastebin, fetchPastebin} from './redux/modules/pastebin';
import {loadMonacoFulfilled, loadMonacoRejected} from "./redux/modules/monaco";
import {getLocationUrlData} from "./utils/scrUtils";

const urlData = getLocationUrlData();

const store = configureStore();
const {dispatch} = store;
window.addEventListener("beforeunload", function () {
    dispatch(disposePastebin());
}, false);

dispatch(fetchPastebin(urlData.hash));
const onConfigureMonacoError = error => dispatch(loadMonacoRejected(error));
const onMonacoConfigured = monaco => {
    if (monaco) {
        dispatch(loadMonacoFulfilled(monaco));
    } else {
        onConfigureMonacoError('Monaco failed to load. Try refreshing' +
            ' page, and cache if necessary.');
    }
};

const monacoPromise = async () => await import ('monaco-editor');
monacoPromise().then(monaco => {
    configureMonacoDefaults(monaco);
    onMonacoConfigured(monaco);
});

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <Index url={urlData.url} mediaQuery={'(prefers-color-scheme: light)'}
                   mediaQueryOptions={{noSsr: true}}/>
        </Provider>
    </React.StrictMode>,
    document.querySelector('#root')
);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();