import React from 'react';
import {create} from 'jss';
import JssProvider from 'react-jss/lib/JssProvider';
import {
  MuiThemeProvider,
  createMuiTheme,
  createGenerateClassName,
  jssPreset,
} from 'material-ui/styles';
import blue from 'material-ui/colors/blue';
import orange from 'material-ui/colors/orange';

// A theme with custom primary and secondary color.
// It's optional.
const theme = createMuiTheme({
  primary: {
    light: blue[300],
    main: blue[500],
    dark: blue[700],
  },
  secondary: {
    light: orange[300],
    main: orange[500],
    dark: orange[700],
  },
});

// Create a JSS instance with the default preset of plugins.
// It's optional.
const jss = create(jssPreset());

// The standard class name generator.
// It's optional.
const generateClassName = createGenerateClassName();

function withRoot(Component) {
  function WithRoot(props) {
    // JssProvider allows customizing the JSS styling solution.
    return (
      <JssProvider jss={jss} generateClassName={generateClassName}>
        {/* MuiThemeProvider makes the theme available down the React tree
          thanks to React context. */}
        <MuiThemeProvider theme={theme}>
          <Component {...props} />
        </MuiThemeProvider>
      </JssProvider>
    );
  }

  return WithRoot;
}

export default withRoot;
