import {getDefaultTextForLanguage} from '../common/pastebinContent';
export function getDefaultPastebinContent(){
  return {
    'html': getDefaultTextForLanguage('html'),
    'css': getDefaultTextForLanguage('css'),
    'js': getDefaultTextForLanguage('js'),
  };
}
