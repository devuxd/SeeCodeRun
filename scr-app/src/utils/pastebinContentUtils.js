import {editorIds} from '../core/AppManager';
import {getDefaultTextForLanguage} from '../common/pastebinContent';

export function getDefaultPastebinContent() {
  const defaultPastebinContent={};
  for (const editorId in editorIds) {
    defaultPastebinContent[editorIds[editorId]]=getDefaultTextForLanguage(editorIds[editorId]);
  }
  return defaultPastebinContent;
}
