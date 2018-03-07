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
  firecoEditorEpic
}
  from './fireco';
import {
  configureMonacoModelsEpic,
  updateMonacoModelsEpic,
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
  monacoEditorsEpic,
  updatePlaygroundEpic,
  updatePlaygroundInstrumentationEpic,
  firecoEditorsEpic,
  firecoActivateEpic,
  firecoEditorEpic,
);

export const rootReducer=combineReducers({
  pastebinReducer,
  monacoReducer,
  monacoEditorsReducer,
  firecoReducer,
  updatePlaygroundReducer
});
