import React, {
   createContext, useCallback, useEffect, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import {
   ThemeProvider,
   StyledEngineProvider,
   CssBaseline,
} from '@material-ui/core';
// import { StylesProvider } from '@material-ui/styles'; // breaks theme
import {
   createTheme,
   responsiveFontSizes,
   alpha,
} from '@material-ui/core/styles';

import indigo from '@material-ui/core/colors/indigo';
import deepOrange from '@material-ui/core/colors/deepOrange';

import {chromeDark, chromeLight} from 'react-inspector';

export const ThemeContext = createContext({
   switchTheme: null,
   themeType: null,
   muiTheme: null,
   inspectorTheme: null,
   inspectorCompactTheme: null,
   monacoTheme: null,
});

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
   },
   navigatorIndex: {
      fontSize: 11,
   },
   navigatorMax: {
      fontSize: 9,
      paddingTop: 3,
   }
};

const getMuiThemeOptions = (palette) => ({
   spacingUnit,
   palette,
   typography,
});

const getLightTheme = () => responsiveFontSizes(
   createTheme(getMuiThemeOptions(lightPalette))
);

const getDarkTheme = () => responsiveFontSizes(
   createTheme(getMuiThemeOptions(darkPalette))
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
   ...chromeDark, ...({
      BASE_BACKGROUND_COLOR: 'transparent',
      OBJECT_VALUE_STRING_COLOR: 'rgb(206,145,120)',
   })
};
// console.log(muiChromeDark);

const muiChromeDarkCompact = {
   ...muiChromeDark, ...({
      BASE_FONT_SIZE: '9px',
      TREENODE_FONT_SIZE: "9px",
   })
};

export const MonacoHighlightTypes = {
   text: 'monaco-editor-decoration-les-textHighlight-text',
   error: 'monaco-editor-decoration-les-textHighlight-error',
   graphical: 'monaco-editor-decoration-les-textHighlight-graphical',
   globalBranch: 'monaco-editor-decoration-les-textHighlight-global-branch',
   localBranch: 'monaco-editor-decoration-les-textHighlight-local-branch',
};

export const MonacoExpressionClassNames = {
   defaultExpressionClassName: 'monaco-editor-decoration-les-expression',
   deadExpressionClassName: 'monaco-editor-decoration-les-expressionDead',
   liveExpressionClassName: 'monaco-editor-decoration-les-expressionLive',
   liveExpressionNavClassName: 'monaco-editor-decoration-les-expressionNavLive',
   errorExpressionClassName: 'monaco-editor-decoration-les-expressionError',
   branchExpressionClassName: 'monaco-editor-decoration-les-expressionBranch',
   liveExpressionDependencyClassName:
      'monaco-editor-decoration-les-expressionDependencyLive',
   
};

export const ThemesRef = {
   current: {
      highlighting: {
         text: {},
         error: {},
         graphical: {},
         globalBranch: {},
         localBranch: {},
      },
   },
};

function makeThemes(themeType) {
   if (!getMuiThemes[themeType]) {
      return;
   }
   const theme = getMuiThemes[themeType]();
   const inspectorTheme = themeType === themeTypes.darkTheme ?
      muiChromeDark : muiChromeLight;
   const inspectorCompactTheme = themeType === themeTypes.darkTheme ?
      muiChromeDarkCompact : muiChromeLightCompact;
   
   ThemesRef.current = {
      highlighting: {
         text: theme.palette.action.hover,
         object: alpha(theme.palette.primary.main, 0.1),
         graphical: alpha(theme.palette.secondary.main, 0.08),
         error: alpha(theme.palette.error.main, 0.08),
         globalBranch: alpha(theme.palette.primary.main, 0.08),
         localBranch: alpha(theme.palette.secondary.main, 0.08),
      },
      themeType,
      muiTheme: theme,
      inspectorTheme,
      inspectorCompactTheme,
      monacoTheme: themeType === themeTypes.darkTheme ?
         'vs-dark' : 'vs-light',
      inspectorGraphicalTheme: {
         ...inspectorTheme,
         ARROW_COLOR: theme.palette.secondary.main
      },
      inspectorCompactGraphicalTheme: {
         ...inspectorCompactTheme,
         ARROW_COLOR: theme.palette.secondary.main
      },
   }
   return ThemesRef.current;
}

export function useThemes(themeType, switchTheme) {
   const themes = useMemo(() => makeThemes(themeType), [themeType]);
   themes.switchTheme = switchTheme;
   return themes;
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
            
            setThemeUserOverrides(themeUserOverrides => {
               if (themeUserOverrides) {
                  return nextThemeType;
               }
               _setThemeType(nextThemeType);
               return null;
            });
            
         }
      }, [
         themeType,
      ]);
      
      useEffect(() => {
         _setThemeType(preferredThemeType);
      }, [preferredThemeType]);
      
      const themes = useThemes(themeType, switchTheme);
      
      return (
         <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes.muiTheme}>
               <CssBaseline/>
               <Component
                  themes={themes}
                  {...props}
               />
            </ThemeProvider>
         </StyledEngineProvider>
      );
   });
};

withThemes.propTypes = {
   mediaQueryResult: PropTypes.any.isRequired,
};
