import {getEditorIds} from '../seecoderun/AppManager';
import {getDefaultTextForLanguage} from '../common/pastebinContent';

export function getDefaultPastebinContent() {
  const defaultPastebinContent={};
  const editorIds=getEditorIds();
  for (const editorId in editorIds) {
    defaultPastebinContent[editorIds[editorId]]=getDefaultTextForLanguage(editorIds[editorId]);
  }
  return defaultPastebinContent;
}