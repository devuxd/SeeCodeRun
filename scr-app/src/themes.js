import React, {useMemo} from 'react';
import {createMuiTheme, responsiveFontSizes} from '@material-ui/core/styles';
import {chromeDark, chromeLight} from 'react-inspector';

const palette = {
    type: 'light',
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
    quaternary: {
        light: '#ff6090',
        main: '#e91e63',
        dark: '#b0003a',
        contrastText: '#000',
    },
};
const getLightTheme = () => responsiveFontSizes(createMuiTheme({
    palette,
    typography: {
        useNextVariants: true,
    },
}));

const getDarkTheme = () => responsiveFontSizes(createMuiTheme({
    palette: {
        ...palette,
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
}));

export const themeTypes = {
    lightTheme: 'lightTheme',
    darkTheme: 'darkTheme',
};

const themes = {
    [themeTypes.lightTheme]: getLightTheme,
    [themeTypes.darkTheme]: getDarkTheme,
};

const muiChromeLight = {...chromeLight, ...({BASE_BACKGROUND_COLOR: 'transparent'})};
const muiChromeDark = {...chromeDark, ...({BASE_BACKGROUND_COLOR: 'transparent'})};

export function getThemes(themeType) {
    return themes[themeType] && {
        theme: themes[themeType](),
        inspectorTheme: themeType === themeTypes.darkTheme ? muiChromeDark : muiChromeLight,
        monacoTheme: themeType === themeTypes.darkTheme ? 'vs-dark' : 'vs-light'
    };
}

export function useThemes(themeType) {
    return useMemo(getThemes(themeType), [themeType]);
}

export default function withThemes(Component) {
    return function WithThemes(props) {
        return <Component {...props} themes={useThemes(props.themeType)}/>;
    }
}