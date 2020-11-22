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
    pastebinSearchStateChangeEpic,
} from './pastebin';

import {
    firecoReducer,
    firecoEditorsEpic,
    firecoActivateEpic,
    firecoEditorEpic,
    firecoEditorsSetUserIdEpic,
    firecoEditorsReadyEpic,
    firecoChatEpic,
    firecoPersistableComponentEpic,
} from './fireco';
import {
    loadMonacoEpic,
    configureMonacoModelsEpic,
    updateMonacoModelsEpic,
    configureMonacoThemeSwitchEpic,
    monacoReducer,
} from './monaco';

import {
    monacoEditorsEpic,
    monacoEditorsReducer,
    mountedEditorEpic,
} from './monacoEditor';

import {
    updatePlaygroundReducer,
} from './playground';

import {updateBundleReducer} from './liveExpressionStore';

export const rootEpic = combineEpics(
    disposePastebinEpic,
    pastebinLayoutEpic,
    pastebinEpic,
    pastebinContentEpic,
    pastebinContentRejectedEpic,
    pastebinSearchStateChangeEpic,
    pastebinTokenEpic,
    pastebinTokenRejectedEpic,
    mountedEditorEpic,
    firecoEditorsSetUserIdEpic,
    firecoEditorsReadyEpic,
    loadMonacoEpic,
    configureMonacoModelsEpic,
    updateMonacoModelsEpic,
    configureMonacoThemeSwitchEpic,
    monacoEditorsEpic,
    // updatePlaygroundEpic,
    // updatePlaygroundInstrumentationEpic,
    firecoEditorsEpic,
    firecoActivateEpic,
    firecoEditorEpic,
    firecoChatEpic,
    firecoPersistableComponentEpic,
);

export const rootReducer = combineReducers({
    pastebinReducer,
    monacoReducer,
    monacoEditorsReducer,
    firecoReducer,
    updateBundleReducer,
    updatePlaygroundReducer,
});
