import {compose, createStore, applyMiddleware} from 'redux';
import {createEpicMiddleware} from 'redux-observable';
import {rootEpic, rootReducer} from './modules/root';
import configureAppManager from "../seecoderun/AppManager";

const epicMiddleware = createEpicMiddleware({
    dependencies: {appManager: configureAppManager()}
});

export default function configureStore() {
    let store = null;

    if (process.env.NODE_ENV === 'production') {
        store = applyMiddleware(epicMiddleware)(createStore)(rootReducer);
        epicMiddleware.run(rootEpic);
    } else {
        let finalCreateStore =
            // if there is a browser extension of Redux devtools, that will be used instead
            typeof window === 'object' &&
            window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
                reducer => {
                    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
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
        epicMiddleware.run(rootEpic);
        // Enable Webpack hot module replacement for reducers
        if (module) {
            module.hot.accept('./modules/root', () => {
                const nextRootReducer = require('./modules/root').default;
                store.replaceReducer(nextRootReducer);
            });
        }
    }

    return store;
}
