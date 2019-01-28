import React, {Component} from 'react';
import {create} from 'jss';
import JssProvider from 'react-jss/lib/JssProvider';
import {
    MuiThemeProvider,
    createMuiTheme,
    createGenerateClassName,
    jssPreset,
} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const palette = {
    primary: {
        light: '#5e92f3',
        main: '#1565c0',
        dark: '#003c8f',
        contrastText: '#fff',
    },
    secondary: {
        light: '#ff8a50',
        main: '#ff5722',
        dark: '#c41c00',
        contrastText: '#000',
    },
    tertiary: {
        light: '#ffff6e',
        main: '#cddc39',
        dark: '#99aa00',
        contrastText: '#000',
    },
    quaternary:{
        light: '#ff6090',
        main: '#e91e63',
        dark: '#b0003a',
        contrastText: '#000',
    },
};
const lightTheme = createMuiTheme({
    palette,
    typography: {
        useNextVariants: true,
    },
});

const darkTheme = createMuiTheme({
    palette: {...palette,
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
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

jss.options.createGenerateClassName = createGenerateClassName;

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
                <CssBaseline/>
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
            <JssProvider jss={jss}>
                <MuiThemeProviderComponent Component={Component}
                                           ComponentProps={props}/>
            </JssProvider>
        );
    }

    return WithRoot;
}

export default withRoot;
