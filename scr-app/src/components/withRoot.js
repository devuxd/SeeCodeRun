/* eslint-disable flowtype/require-valid-file-annotation */

import React, {Component} from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import {withStyles, MuiThemeProvider} from 'material-ui/styles';
import wrapDisplayName from 'recompose/wrapDisplayName';
import createContext from '../styles/createContext';
import PropTypes from "prop-types";

// Apply some reset
const styles = theme => ({
  '@global': {
    html: {
      background: theme.palette.background.default,
      WebkitFontSmoothing: 'antialiased', // Antialiasing.
      MozOsxFontSmoothing: 'grayscale', // Antialiasing.
      height: '100%',
      width: '100%'
    },
    body: {
      minHeight: '100%',
      minWidth: '100%',
      height: '100%',
      width: '100%',
      margin: 0,
      padding: 0
    },
    "#root": {
      height: '100%',
      width: '100%'
    }
  }
});

let AppWrapper = props => props.children;

AppWrapper = withStyles(styles)(AppWrapper);

const context = createContext();

function withRoot(BaseComponent) {
  class WithRoot extends Component {
    componentDidMount() {
      // Remove the server-side injected CSS.
      const jssStyles = document.querySelector('#jss-server-side');
      if (jssStyles && jssStyles.parentNode) {
        jssStyles.parentNode.removeChild(jssStyles);
      }
      //cleaning warnings from Material-UI PropTypes checking
      // console.clear();
    }

    render() {
      return (
        <JssProvider registry={context.sheetsRegistry} jss={context.jss}>
          <MuiThemeProvider theme={context.theme} sheetsManager={context.sheetsManager}>
            <AppWrapper>
              <BaseComponent/>
            </AppWrapper>
          </MuiThemeProvider>
        </JssProvider>
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    WithRoot.displayName = wrapDisplayName(BaseComponent, 'withRoot');
  }

  return WithRoot;
}

withRoot.propTypes = {
  jss: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  sheetsManager: PropTypes.object.isRequired,
  sheetsRegistry: PropTypes.object.isRequired
};

export default withRoot;
