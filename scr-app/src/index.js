import update, {extend} from "immutability-helper";

extend("$auto", function (value, object) {
    return object ? update(object, value) : update({}, value);
});
extend("$autoArray", function (value, object) {
    return object ? update(object, value) : update([], value);
});

import {enableMapSet, enablePatches} from "immer";

enableMapSet();
enablePatches();

import React, {StrictMode} from 'react'; //, useMemo, Suspense, lazy
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import reportWebVitals from './reportWebVitals';
// import Box from '@mui/material/Box';
// import Typography from '@mui/material/Typography';
// import LinearProgress from '@mui/material/LinearProgress';
// import {createRoot} from 'react-dom/client'; // causes infinite loop of set value in editors =(
import configureStore from './redux/configureStore';
import Index from './pages/Index';

//  window.MonacoEnvironment = {globalAPI: true}; //fixes monaco 0.22.0 breaking change.
global.MonacoEnvironment = {globalAPI: true}; //fixes monaco 0.22.0 breaking change.

const {store, urlData, dependencies} = configureStore(window);

const indexProps = {
    mediaQuery: '(prefers-color-scheme: light)',
    mediaQueryOptions: {noSsr: true},
    url: urlData.url,
    dependencies,
};

// const Index = (props) => { // only -23kb improvement
//     const ImportedIndex = useMemo(
//         () => (lazy(() => import('./pages/Index'))),
//         []
//     );
//
//     return (
//         <Suspense fallback={ <h4>Loading SCR...</h4>
//             // <Box sx={{display: 'flex', alignItems: 'center'}}>
//             //     <Box sx={{minWidth: 35}}>
//             //         <Typography variant="body2" color="text.secondary">{`Loading SCR ...`}</Typography>
//             //     </Box>
//             //     <Box sx={{width: '100%', mr: 1}}>
//             //         <LinearProgress/>
//             //     </Box>
//             // </Box>
//         }>
//             <ImportedIndex {...props}/>
//         </Suspense>
//     );
// };

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
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// removed cloud-functions: no need for "proxy": "http://localhost:5000", in package.json
