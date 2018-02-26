import {combineEpics} from 'redux-observable';
import {combineReducers} from 'redux';
import {
  disposePastebinEpic,
  pastebinEpic,
  pastebinTokenEpic,
  pastebinReducer,
  pastebinContentEpic
} from './pastebin';
import {
  firecoEpic,
  firecoSetTextEpic,
  firecoGetTextEpic,
  firecoReducer,
  firecoEditorsEpic,
  firecoActivateEpic,
  firecoEditorEpic
}
  from './fireco';
import {
  monacoEpic,
  monacoReducer
}
  from './monaco';
import {
  monacoEditorsEpic,
  monacoEditorEpic,
  monacoEditorsReducer,
  mountedEditorEpic
} from './monacoEditor'
import {
  updatePlaygroundEpic,
  updatePlaygroundReducer
}
  from './playground';

export const rootEpic = combineEpics(
  disposePastebinEpic,
  pastebinEpic,
  pastebinContentEpic,
  pastebinTokenEpic,
  mountedEditorEpic,
  monacoEpic,
  monacoEditorsEpic,
  monacoEditorEpic,
  updatePlaygroundEpic,
  firecoEpic,
  firecoEditorsEpic,
  firecoActivateEpic,
  firecoEditorEpic,
  firecoSetTextEpic,
  firecoGetTextEpic,
);

export const rootReducer = combineReducers({
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





