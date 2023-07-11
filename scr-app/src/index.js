import React, {StrictMode} from 'react';
import ReactDOM from 'react-dom';
// import {createRoot} from 'react-dom/client'; // causes infinite loop of set value in editors =(
import {Provider} from 'react-redux';
import update, {extend} from "immutability-helper";

extend("$auto", function (value, object) {
    return object ? update(object, value) : update({}, value);
});
extend("$autoArray", function (value, object) {
    return object ? update(object, value) : update([], value);
});

import configureStore from './redux/configureStore';
import Index from './pages/Index';
import * as serviceWorker from './serviceWorker';

const {store, urlData} = configureStore(window);

const indexProps = {
    mediaQuery: '(prefers-color-scheme: light)',
    mediaQueryOptions: {noSsr: true},
    url: urlData.url,
};

// createRoot(document.querySelector('#root'))
ReactDOM
    .render(
        <StrictMode>
            <Provider store={store}>
                <Index {...indexProps}/>
            </Provider>
        </StrictMode>,
        document.querySelector('#root')
    );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();

// removed cloud-functions: no need for "proxy": "http://localhost:5000", in package.json
