import {combineEpics} from 'redux-observable';
import {combineReducers} from 'redux';
import {
  disposePastebinEpic,
  pastebinLayoutEpic,
  pastebinEpic,
  pastebinTokenEpic,
  pastebinReducer,
  pastebinContentEpic
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
  pastebinTokenEpic,
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

// export const rootSubscriber = store => combineSubscribers(store, {
//
// });

// export function combineSubscribers(store, subscribers) {
//   const unsubscribes = {};
//   for (const moduleName in subscribers) {
//     if (subscribers.hasOwnProperty(moduleName)) {
//       unsubscribes[moduleName] = subscribers[moduleName](store);
//     }
//   }
//   return function combinedUnsubscribe() {
//     for (const moduleName in unsubscribes) {
//       unsubscribes[moduleName]();
//     }
//   }
// }





