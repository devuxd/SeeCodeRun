import {combineEpics} from 'redux-observable';
import {combineReducers} from 'redux';
import {
  disposePastebinEpic,
  pastebinLayoutEpic,
  pastebinEpic,
  pastebinTokenEpic,
  pastebinTokenRejectedEpic,
  pastebinReducer,
  pastebinContentEpic,
  pastebinContentRejectedEpic,
} from './pastebin';
import {
  firecoReducer,
  firecoEditorsEpic,
  firecoActivateEpic,
  firecoEditorEpic,
  firecoChatEpic
}
  from './fireco';
import {
  configureMonacoModelsEpic,
  updateMonacoModelsEpic,
  configureMonacoThemeSwitchEpic,
  monacoReducer
}
  from './monaco';
import {
  monacoEditorsEpic,
  monacoEditorsReducer,
  mountedEditorEpic
} from './monacoEditor'
import {
  updatePlaygroundEpic,
  updatePlaygroundInstrumentationEpic,
  updatePlaygroundReducer
}
  from './playground';

export const rootEpic=combineEpics(
  disposePastebinEpic,
  pastebinLayoutEpic,
  pastebinEpic,
  pastebinContentEpic,
  pastebinContentRejectedEpic,
  pastebinTokenEpic,
  pastebinTokenRejectedEpic,
  mountedEditorEpic,
  configureMonacoModelsEpic,
  updateMonacoModelsEpic,
  configureMonacoThemeSwitchEpic,
  monacoEditorsEpic,
  updatePlaygroundEpic,
  updatePlaygroundInstrumentationEpic,
  firecoEditorsEpic,
  firecoActivateEpic,
  firecoEditorEpic,
  firecoChatEpic,
);

export const rootReducer=combineReducers({
  pastebinReducer,
  monacoReducer,
  monacoEditorsReducer,
  firecoReducer,
  updatePlaygroundReducer
});
