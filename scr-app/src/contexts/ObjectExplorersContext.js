import React, {
   createContext, useMemo, useRef, useCallback, useEffect, useState
} from 'react';

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

const useObjectRestorers = () => {
   const restorersRef = useRef({});
   const updatedRef = useRef(Date.now());
   const lastPurgeRef = useRef(null);
   
   const purgeRestorers = useCallback(
      (ttl = 15000) => {
         let current = Date.now();
         updatedRef.current = current;
         
         if (!lastPurgeRef.current) {
            lastPurgeRef.current = current;
         }
         
         if (lastPurgeRef.current - current < ttl) {
            return;
         }
         
         lastPurgeRef.current = current;
         
         const restorers = restorersRef.current;
         for (let key in restorers) {
            const restorer = restorers[key];
            if (current - restorer.updated >= ttl) {
               restorer.destroy();
            }
         }
      },
      []
   );
   
   const obtainRestorer = useCallback((key) => {
         purgeRestorers();
         if (!restorersRef.current[key]) {
            let _current = {};
            const restore = () => _current;
            const save = (current) => {
               _current = current;
            };
            const destroy = () => {
               return delete restorersRef.current[key];
            };
            
            const restorer = {restore, save, destroy};
            
            if (key === null || key === undefined) {
               return restorer;
            }
            
            restorersRef.current[key] = restorer;
         }
         
         restorersRef.current[key].updated = updatedRef.current;
         return restorersRef.current[key];
      },
      [purgeRestorers]
   );
   
   return {restorersRef, obtainRestorer};
};

export const useStateWithRestorer = (restorer) => {
   const stateAndSetter = useState(() => restorer.restore());
   const [state] = stateAndSetter;
   
   useEffect(() => {
         return () => restorer.save(state);
      },
      [restorer, state]
   );
   
   return stateAndSetter;
}


const ObjectExplorersContext = createContext([
   {current: {}},
   () => {},
   () => {},
]);

export const objectExplorersAcceptor = (WrappedComponent) =>
   (props) => {
      const context = useObjectRestorers();
      return (<ObjectExplorersContext.Provider value={context}>
         <WrappedComponent {...props}/>
      </ObjectExplorersContext.Provider>);
   };

export default ObjectExplorersContext;
