import {applyMiddleware, compose, createStore} from 'redux';
import {createEpicMiddleware} from 'redux-observable';
import {rootEpic, rootReducer} from './modules/root';
import configureAppManager from '../core/AppManager';
import {disposePastebin} from './modules/pastebin';

export const getLocationUrlData = (aWindow) => {
    return {
        url:
            process.env.PUBLIC_URL ||
            `${aWindow.location.origin}`,
        hash: `${aWindow.location.hash}`
    };
};
export default function configureStore(aWindow) {
    const urlData = getLocationUrlData(aWindow);
    const epicMiddleware = createEpicMiddleware({
        dependencies: {appManager: configureAppManager(urlData)}
    });
    let store = null;

    if (process.env.NODE_ENV === 'production') {
        store = applyMiddleware(epicMiddleware)(createStore)(rootReducer);
    } else {
        let finalCreateStore =
            // if there is a browser extension of Redux devtools, that will be used instead
            typeof aWindow === 'object' &&
            aWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
                reducer => {
                    const composeEnhancers = aWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                        // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
                    });
                    const enhancer = composeEnhancers(
                        applyMiddleware(epicMiddleware)
                    );
                    return createStore(reducer, enhancer);
                } :
                reducer => {
                    const createStoreWithEnhancers = compose(
                        applyMiddleware(epicMiddleware),
                        // Required! Enable Redux DevTools with the monitors you chose
                        require('./devtools/DevTools').default.instrument()
                    )(createStore);
                    const store = createStoreWithEnhancers(reducer);
                    const showDevTools = require('./devtools/showDevTools').default;
                    showDevTools(store);

                    return store;

                };
        store = finalCreateStore(rootReducer);

        // Enable Webpack hot module replacement for reducers
        if (module) {
            module.hot.accept('./modules/root', () => {
                const nextRootReducer = require('./modules/root').default;
                store.replaceReducer(nextRootReducer);
            });
        }
    }
    const {dispatch} = store;

    aWindow.addEventListener("beforeunload", () => {
        dispatch(disposePastebin());
    }, false);

    epicMiddleware.run(rootEpic);
    return {urlData, store};
}
