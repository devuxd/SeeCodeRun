import {combineEpics} from 'redux-observable';
import {combineReducers} from 'redux';
import {
  disposePastebinEpic,
  pastebinEpic,
  pastebinTokenEpic,
  authPastebinEpic,
  pastebinReducer, pastebinSubscribe
} from './pastebin';
import {firepadsEpic, firepadReducer} from './firepad';
import {firecoEpic, firecoSetTextEpic, firecoGetTextEpic, firecoReducer, firecoSubscribe, firecosEpic} from './fireco';
import {monacoEpic, monacoReducer} from './monaco';
import {
  monacoModelsEpic, monacoEditorsEpic, monacoEditorEpic, monacoEditorsReducer,
  mountedEditorEpic
} from './monacoEditor'
import {updatePlaygroundEpic, updatePlaygroundReducer} from './playground';

export const rootEpic = combineEpics(
  disposePastebinEpic,
  pastebinEpic,
  pastebinTokenEpic,
  authPastebinEpic,
  firepadsEpic,
  mountedEditorEpic,
  monacoModelsEpic,
  monacoEpic,
  monacoEditorsEpic,
  monacoEditorEpic,
  firecoEpic,
  firecosEpic,
  firecoSetTextEpic,
  firecoGetTextEpic,
  updatePlaygroundEpic
);

export const rootReducer = combineReducers({
  pastebinReducer,
  firepadReducer,
  monacoReducer,
  monacoEditorsReducer,
  firecoReducer,
  updatePlaygroundReducer
});

export const rootSubscriber = store => combineSubscribers(store, {
  pastebinSubscribe,
  firecoSubscribe
});

export function combineSubscribers(store, subscribers) {
  const unsubscribes = {};
  for (const moduleName in subscribers) {
    if(subscribers.hasOwnProperty(moduleName)){
      unsubscribes[moduleName] = subscribers[moduleName](store);
    }
  }
  return function combinedUnsubscribe() {
    for (const moduleName in unsubscribes) {
      unsubscribes[moduleName]();
    }
  }
}





