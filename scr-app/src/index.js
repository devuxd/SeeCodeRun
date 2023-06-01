import React, {StrictMode} from 'react';
// import {createRoot} from 'react-dom/client';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import update, {extend} from "immutability-helper";

extend("$auto", function (value, object) {
    return object ? update(object, value) : update({}, value);
});
extend("$autoArray", function (value, object) {
    return object ? update(object, value) : update([], value);
});

import * as serviceWorker from './serviceWorker';

import configureStore from './redux/configureStore';
import Index from './pages/Index';

const {store, urlData} = configureStore(window);

// createRoot(document.querySelector('#root'))
ReactDOM
    .render(
        <StrictMode>
            <Provider store={store}>
                <Index url={urlData.url} mediaQuery={'(prefers-color-scheme: light)'}
                       mediaQueryOptions={{noSsr: true}}/>
            </Provider>
        </StrictMode>,
        document.querySelector('#root')
    );
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
