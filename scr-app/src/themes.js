import {
   createContext, useCallback, useEffect, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import {
   ThemeProvider,
   StyledEngineProvider,
   CssBaseline,
} from '@mui/material';
// import { StylesProvider } from '@mui/styles'; // breaks theme
import {
   createTheme,
   responsiveFontSizes,
   alpha,
} from '@mui/material/styles';

import indigo from '@mui/material/colors/indigo';
import deepOrange from '@mui/material/colors/deepOrange';

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

const APP_BAR_HEIGHT = 58;
const SPACING_UNIT = 8;

const appUnits = {
   margin: SPACING_UNIT,
   marginArray: [SPACING_UNIT, SPACING_UNIT],
   appBarHeight: APP_BAR_HEIGHT,
   rowHeightSmall: APP_BAR_HEIGHT,
   rowHeight: APP_BAR_HEIGHT,
};

const spacingUnit = x => x * SPACING_UNIT;

const typography = {
   code: {
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontWeight: 'normal',
      fontSize: 10,//12,//'0.75rem', // Monaco does not support REM
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
   appUnits,
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

const muiChromeBase = {
   ARROW_FONT_SIZE: '10px',
   BASE_BACKGROUND_COLOR: 'transparent',
};

const muiChromeCompact = {
   ARROW_FONT_SIZE: '9px',
   BASE_FONT_SIZE: '9px',
   TREENODE_FONT_SIZE: "9px",
};

const muiChromeLight = {
   ...chromeLight, ...muiChromeBase
};

const muiChromeLightCompact = {
   ...muiChromeLight, ...muiChromeCompact
};

const muiChromeDark = {
   ...chromeDark, ...muiChromeBase,
   OBJECT_VALUE_STRING_COLOR: 'rgb(206,145,120)',
};
// console.log(muiChromeDark);

const muiChromeDarkCompact = {
   ...muiChromeDark, ...muiChromeCompact
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
   liveExpressionDependencyClassName: 'monaco-editor-decoration-les-expressionDependencyLive',
   commentGlyphMarginClassName:'monaco-editor-ale-commentGlyph',
   
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
