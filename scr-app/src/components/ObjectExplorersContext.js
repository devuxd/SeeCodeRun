import {createContext, createRef} from 'react';

export const objectValueFormatter = (object, type) => {
   switch (type) {
      case 'any':
         return object;
      case 'bigint':
         return String(object);
      case 'number':
         return String(object);
      case 'string':
         return object;
      case 'boolean':
      case 'undefined':
      case 'null':
      case 'Date':
      case 'RegExp':
         return `${object}`;
      case 'Array':
         return `Array(${object.length})`;
      case 'Object':
         return 'Object';
      case 'Buffer':
         return `Buffer[${object.length}]`;
      case 'Class':
         return object.constructor.name;
      case 'function':
         return `${object.name}()`;
      case 'symbol':
         return `${object.toString()}`;
      default:
         return '';
   }
};

const objectExplorersCache = createRef();

export const getNewObjectExplorersCache = (val = {}) => {
   objectExplorersCache.current = [...(objectExplorersCache.current || [])];
   objectExplorersCache.current[0] = val;
   return objectExplorersCache;
};

const makeObjectExplorers = (
   state = [
      {},
      getNewObjectExplorersCache,
      objectValueFormatter
   ]
) => {
   objectExplorersCache.current = state;
   return objectExplorersCache;
};

const ObjectExplorersContext = createContext(makeObjectExplorers());

export default ObjectExplorersContext;
