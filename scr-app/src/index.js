import 'react-resizable/css/styles.css';
import './utils/react-grid-layout-scr-theme.css';

import {Provider} from 'react-redux';
import configureStore from './redux/configureStore';

import * as serviceWorker from './serviceWorker';

import React from 'react';
import ReactDOM from 'react-dom';
import Index from './pages/Index';
import {getLocationUrlData} from "./utils/scrUtils";

const urlData = getLocationUrlData();

const store = configureStore(urlData, window);

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