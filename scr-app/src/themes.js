import React, {
    createContext, useState, useMemo, useCallback, useEffect
} from 'react';
import PropTypes from 'prop-types';
import {
    createMuiTheme,
    responsiveFontSizes,
} from '@material-ui/core/styles';
import {chromeDark, chromeLight} from 'react-inspector';
import {ThemeProvider} from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

export const ThemeContext = createContext({
    switchTheme: null,
    themeType: null,
    muiTheme: null,
    inspectorTheme: null,
    monacoTheme: null,
});

const palette = {
    mode: null,
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

const getMuiThemeOptions = (mode) => ({
    spacingUnit: x => x * 8,
    palette: {
        ...palette,
        mode,
    },
    typography: {
        useNextVariants: true,
    },
});

const getLightTheme = () => responsiveFontSizes(
    createMuiTheme(getMuiThemeOptions('light'))
);

const getDarkTheme = () => responsiveFontSizes(
    createMuiTheme(getMuiThemeOptions('dark'))
);

export const themeTypes = {
    lightTheme: 'lightTheme',
    darkTheme: 'darkTheme',
};

const getMuiThemes = {
    [themeTypes.lightTheme]: getLightTheme,
    [themeTypes.darkTheme]: getDarkTheme,
};

const muiChromeLight = {
    ...chromeLight, ...({BASE_BACKGROUND_COLOR: 'transparent'})
};

const muiChromeDark = {
    ...chromeDark, ...({BASE_BACKGROUND_COLOR: 'transparent'})
};

export function getThemes(themeType) {
    if (!getMuiThemes[themeType]) {
        return;
    }
    return {
        muiTheme: getMuiThemes[themeType](),
        inspectorTheme: themeType === themeTypes.darkTheme ?
            muiChromeDark : muiChromeLight,
        monacoTheme: themeType === themeTypes.darkTheme ?
            'vs-dark' : 'vs-light'
    };
}

export function useThemes(themeType) {
    return useMemo(() => getThemes(themeType), [themeType]);
}

export default function withThemes(Component) {
    return (function WithThemes(props) {
        const {mediaQueryResult: prefersLightMode} = props;
        const preferredThemeType = prefersLightMode ?
            themeTypes.lightTheme : themeTypes.darkTheme;

        const [themeUserOverrides, setThemeUserOverrides] = useState(null);
        const [themeType, setThemeType] = useState(preferredThemeType);

        const activeThemeType = themeUserOverrides || themeType;
        const switchTheme = useCallback((event, newThemeUserOverrides) => {

            if (newThemeUserOverrides && themeTypes[newThemeUserOverrides]) {
                setThemeUserOverrides(newThemeUserOverrides);
            } else {
                const nextThemeType = activeThemeType === themeTypes.darkTheme ?
                    themeTypes.lightTheme
                    : activeThemeType === themeTypes.lightTheme ?
                        themeTypes.darkTheme : themeTypes.lightTheme;
                if (themeUserOverrides) {
                    setThemeUserOverrides(nextThemeType);
                } else {
                    setThemeType(nextThemeType);
                }
            }
        }, [
            activeThemeType,
            setThemeUserOverrides,
            setThemeType,
            themeUserOverrides
        ]);

        useEffect(() => {
            setThemeType(preferredThemeType);
        }, [setThemeType, preferredThemeType]);

        const {
            muiTheme,
            inspectorTheme,
            monacoTheme
        } = useThemes(activeThemeType);

        return (
            <ThemeProvider theme={muiTheme}>
                <CssBaseline/>
                <Component
                    muiTheme={muiTheme}
                    inspectorTheme={inspectorTheme}
                    monacoTheme={monacoTheme}
                    themeType={activeThemeType}
                    switchTheme={switchTheme}
                    {...props}
                />
            </ThemeProvider>);
    });
};

withThemes.propTypes = {
    mediaQueryResult: PropTypes.any.isRequired,
};