import React, {StrictMode} from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import {Provider} from 'react-redux';

import configureStore from './redux/configureStore';
import Index from './pages/Index';

const {store, urlData} = configureStore(window);

ReactDOM.render(
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