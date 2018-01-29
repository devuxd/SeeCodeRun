import {compose, createStore, applyMiddleware} from 'redux';
import {createEpicMiddleware} from 'redux-observable';
import {rootEpic, rootReducer} from './modules/root';
import configureAppManager from "../seecoderun/AppManager";

const epicMiddleware = createEpicMiddleware(rootEpic, {
  dependencies: {appManager: configureAppManager()}
});

export default function configureStore() {
  let finalCreateStore = null;
  if (process.env.NODE_ENV !== 'production') {
    finalCreateStore =
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
    /* eslint-enable */
  } else {
    finalCreateStore = applyMiddleware(epicMiddleware)(createStore);
  }

  const store = finalCreateStore(rootReducer);

  // Enable Webpack hot module replacement for reducers
  if (module) {
    module.hot.accept('./modules/root', () => {
      const nextRootReducer = require('./modules/root').default;
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
