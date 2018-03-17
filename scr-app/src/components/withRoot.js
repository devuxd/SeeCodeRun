import React, {Component} from 'react';
import {create} from 'jss';
import JssProvider from 'react-jss/lib/JssProvider';
import {
  MuiThemeProvider,
  createMuiTheme,
  createGenerateClassName,
  jssPreset,
} from 'material-ui/styles';
import primary from 'material-ui/colors/blue';
import secondary from 'material-ui/colors/deepOrange';
import Reboot from 'material-ui/Reboot';

const lightTheme = createMuiTheme({
  palette: {
    primary: {
      light: primary[300],
      main: primary[500],
      dark: primary[700],
    },
    secondary: {
      light: secondary[300],
      main: secondary[500],
      dark: secondary[700],
    },
  }
});

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      light: primary[300],
      main: primary[500],
      dark: primary[700],
    },
    secondary: {
      light: secondary[300],
      main: secondary[500],
      dark: secondary[700],
    },
  },
});

export const themeTypes = {
  lightTheme: 'lightTheme',
  darkTheme: 'darkTheme',
};

const themes = {
  [themeTypes.lightTheme]: lightTheme,
  [themeTypes.darkTheme]: darkTheme,
};

const jss = create(jssPreset());

const generateClassName = createGenerateClassName();

const MuiThemeProviderComponent = class extends Component {
  state = {
    themeType: themeTypes.lightTheme,
    isSwitchThemeToggled: false,
  };

  switchTheme = (aThemeType) => {
    if (aThemeType && themeTypes[aThemeType]) {
      this.setState({
        themeType: themeTypes[aThemeType],
      });
      return;
    }

    const {themeType} = this.state;
    switch (themeType) {
      case themeTypes.lightTheme:
        this.setState({
          themeType: themeTypes.darkTheme,
        });
        break;
      case themeTypes.darkTheme:
        this.setState({
          themeType: themeTypes.lightTheme,
        });
        break;
      default:
        console.log('Error: unknown theme type');
    }
  };

  render() {
    const {ComponentProps, Component} = this.props;
    const {themeType} = this.state;
    return (
      <MuiThemeProvider theme={themes[themeType]}>
        <Reboot/>
        <Component
          {...ComponentProps}
          themeType={themeType}
          switchTheme={this.switchTheme}
        />
      </MuiThemeProvider>
    );
  }
};

function withRoot(Component) {
  function WithRoot(props) {
    return (
      <JssProvider jss={jss} generateClassName={generateClassName}>
        <MuiThemeProviderComponent Component={Component}
                                   ComponentProps={props}/>
      </JssProvider>
    );
  }

  return WithRoot;
}

export default withRoot;
