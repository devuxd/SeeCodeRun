import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    createMuiTheme,
    CssBaseline,
    responsiveFontSizes,
    StylesProvider,
    ThemeProvider,
} from '@material-ui/core';

import {chromeDark, chromeLight} from 'react-inspector';
import indigo from '@material-ui/core/colors/indigo';
import deepOrange from '@material-ui/core/colors/deepOrange';

export const ThemeContext = createContext({
    switchTheme: null,
    themeType: null,
    muiTheme: null,
    inspectorTheme: null,
    inspectorCompactTheme: null,
    monacoTheme: null,
});

// const palette = { // oldPalette
// primary: {
//     light: '#5e92f3',
//     main: '#1565c0',
//     dark: '#003c8f',
//     contrastText: '#fff',
// },
// secondary: {
//     light: '#ff8a50',
//     main: '#ff5722',
//     dark: '#c41c00',
//     contrastText: '#000',
// },
// tertiary: {
//     light: '#ffff6e',
//     main: '#cddc39',
//     dark: '#99aa00',
//     contrastText: '#000',
// },
// quaternary: {
//     light: '#ff6090',
//     main: '#e91e63',
//     dark: '#b0003a',
//     contrastText: '#000',
// },
// };

const lightPalette = {
    mode: 'light',
    primary: {
        main: indigo['A700'],
    },
    secondary: {
        main: deepOrange['900'],
    },
};

const darkPalette = {
    mode: 'dark',
    primary: {
        main: indigo['A100'],
    },
    secondary: {
        main: deepOrange['A200'],
    },
};

const spacingUnit = x => x * 8;

const typography = {
    code: {
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontWeight: 'normal',
        fontSize: 12,//'0.75rem', // Monaco does not support REM
        fontFeatureSettings: '"liga", "calt"',
        letterSpacing: 'normal',
        textSizeAdjust: '100%',
        whiteSpace: 'nowrap',
        WebkitFontSmoothing: 'antialiased',
    }
};

const getMuiThemeOptions = (palette) => ({
    spacingUnit,
    palette,
    typography,
});

const getLightTheme = () => responsiveFontSizes(
    createMuiTheme(getMuiThemeOptions(lightPalette))
);

const getDarkTheme = () => responsiveFontSizes(
    createMuiTheme(getMuiThemeOptions(darkPalette))
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

const muiChromeLightCompact = {
    ...muiChromeLight, ...({
        BASE_FONT_SIZE: '9px',
        TREENODE_FONT_SIZE: "9px",
    })
};

const muiChromeDark = {
    ...chromeDark, ...({BASE_BACKGROUND_COLOR: 'transparent'})
};

const muiChromeDarkCompact = {
    ...muiChromeDark, ...({
        BASE_FONT_SIZE: '9px',
        TREENODE_FONT_SIZE: "9px",
    })
};

export function getThemes(themeType) {
    if (!getMuiThemes[themeType]) {
        return;
    }
    return {
        themeType,
        muiTheme: getMuiThemes[themeType](),
        inspectorTheme: themeType === themeTypes.darkTheme ?
            muiChromeDark : muiChromeLight,
        inspectorCompactTheme: themeType === themeTypes.darkTheme ?
            muiChromeDarkCompact : muiChromeLightCompact,
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
        const [_themeType, _setThemeType] = useState(preferredThemeType);

        const themeType = themeUserOverrides || _themeType;
        const switchTheme = useCallback((event, newThemeUserOverrides) => {
            if (newThemeUserOverrides && themeTypes[newThemeUserOverrides]) {
                setThemeUserOverrides(newThemeUserOverrides);
            } else {
                const nextThemeType = themeType === themeTypes.darkTheme ?
                    themeTypes.lightTheme
                    : themeType === themeTypes.lightTheme ?
                        themeTypes.darkTheme : themeTypes.lightTheme;
                if (themeUserOverrides) {
                    setThemeUserOverrides(nextThemeType);
                } else {
                    _setThemeType(nextThemeType);
                }
            }
        }, [
            themeType,
            setThemeUserOverrides,
            _setThemeType,
            themeUserOverrides
        ]);

        useEffect(() => {
            _setThemeType(preferredThemeType);
        }, [_setThemeType, preferredThemeType]);

        const _themes = useThemes(themeType);

        const themes = useMemo(() => ({
                ..._themes,
                inspectorGraphicalTheme: {
                    ..._themes.inspectorTheme,
                    ARROW_COLOR: _themes.muiTheme.palette.secondary.main
                },
                inspectorCompactGraphicalTheme: {
                    ..._themes.inspectorCompactTheme,
                    ARROW_COLOR: _themes.muiTheme.palette.secondary.main
                },
                switchTheme
            }),
            [_themes, switchTheme]
        );

        return (
            <StylesProvider injectFirst>
                <ThemeProvider theme={themes.muiTheme}>
                    <CssBaseline/>
                    <Component
                        themes={themes}
                        {...props}
                    />
                </ThemeProvider>
            </StylesProvider>
        );
    });
};

withThemes.propTypes = {
    mediaQueryResult: PropTypes.any.isRequired,
};