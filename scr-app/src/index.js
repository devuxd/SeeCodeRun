import 'bootstrap/dist/css/bootstrap.css';
import 'typeface-roboto';
import './index.css';


import registerServiceWorker from './registerServiceWorker';

import React from 'react';
import { render } from 'react-dom';
import Index from './pages/index';
// import NavigationBar from './components/navigationBar';
import NavigationBar from './components/navigationBarMui';
import PasteBin from './components/pasteBin';

render(<Index />, document.querySelector('#root'));
render(<NavigationBar />, document.querySelector('#navigationBar'));
render(<PasteBin />, document.querySelector('#pasteBin'));

registerServiceWorker();
