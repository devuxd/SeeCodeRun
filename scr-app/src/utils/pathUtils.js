const DEFAULT_ROOT_PATH = '$';

const WILDCARD = '*';

function hasChildNodes(data, dataIterator) {
   return !dataIterator(data).next().done;
}

const wildcardPathsFromLevel = level => {
   return Array.from(
      {length: level},
      (_, i) => [
         DEFAULT_ROOT_PATH
      ].concat(Array.from({length: i}, () => '*')).join('.'),
   );
};

const populatePaths = (
   curData, curPath, depth,
   expandedPaths, keyPaths, dataIterator, searchValueFilter, isSearchActive,
) => {
   if (!isSearchActive && depth === keyPaths.length) {
      expandedPaths.push(curPath);
      return;
   }
   
   const curPathKeys = curPath.replace(/[\$\.]/g, ' ');
   if (isSearchActive) {
      if (searchValueFilter?.(curPathKeys)) {
         expandedPaths.push(curPath);
      }
   }
   const key = keyPaths[depth];
   if (depth === 0) {
      if (
         hasChildNodes(curData, dataIterator) &&
         (key === DEFAULT_ROOT_PATH || key === WILDCARD)
      ) {
         populatePaths(
            curData,
            DEFAULT_ROOT_PATH,
            depth + 1,
            expandedPaths,
            keyPaths,
            dataIterator,
            searchValueFilter,
            isSearchActive,
         );
      } else {
         if (isSearchActive) {
            if (searchValueFilter?.(curData)) {
               expandedPaths.push(`${curPath}.${curData}`);
            }
         }
      }
   } else {
      if (key === WILDCARD) {
         for (let {name, data} of dataIterator(curData)) {
            if (hasChildNodes(data, dataIterator)) {
               populatePaths(
                  data,
                  `${curPath}.${name}`,
                  depth + 1,
                  expandedPaths,
                  keyPaths,
                  dataIterator,
                  searchValueFilter,
                  isSearchActive,
               );
            } else {
               if (isSearchActive) {
                  if (searchValueFilter?.(name)) {
                     expandedPaths.push(`${curPath}.${name}`);
                  }
               }
            }
         }
      } else {
         const value = curData[key];
         if (hasChildNodes(value, dataIterator)) {
            populatePaths(
               value,
               `${curPath}.${key}`,
               depth + 1,
               expandedPaths,
               keyPaths,
               dataIterator,
               searchValueFilter,
               isSearchActive,
            );
         } else {
            if (isSearchActive) {
               if (searchValueFilter?.(value)) {
                  expandedPaths.push(`${curPath}.${value}`);
               }
            }
         }
      }
   }
};

const defaultWildcardPaths = wildcardPathsFromLevel(7);

const cacheLimit = 10000;
const cachedRefs = new Array(cacheLimit);
const cachedVals = new Array(cacheLimit);
let cachedI = -1;
const cache = (obj, cb) => {
   const i = cachedRefs.indexOf(obj);
   if (i < 0 || cachedVals[i] === undefined) {
      cachedI = (cachedI + 1) % cacheLimit;
      cachedRefs[cachedI] = obj;
      cachedVals[cachedI] = cb() ?? null;
      return cachedVals[cachedI];
   }
   return cachedVals[i];
}

export const makeGetExpandedPaths = (
   searchValueFilter,
   checkSearchActive,
   maxSearchExpandLevel,
   disableAutoExpandToPath,
) => (
   data,
   dataIterator,
   expandPaths,
   expandLevel,
   prevExpandedPaths,
) => {
   const isSearchActive = checkSearchActive();
   const expandedPaths = cache(data, () => {
      const wildcardPaths = []
         .concat(
            isSearchActive ? maxSearchExpandLevel ?
               wildcardPathsFromLevel(maxSearchExpandLevel)
               : defaultWildcardPaths
               : wildcardPathsFromLevel(expandLevel)
         )
         .concat(expandPaths)
         .filter(path => typeof path === 'string'); // could be undefined
      
      const expandedPaths = [];
      wildcardPaths.forEach(wildcardPath => {
         const keyPaths = wildcardPath.split('.');
         populatePaths(
            data,
            '',
            0,
            expandedPaths,
            keyPaths,
            dataIterator,
            searchValueFilter,
            isSearchActive
         );
      });
      return expandedPaths;
   });
   // isSearchActive && expandedPaths.length > 0 && console.log(expandedPaths);
   const nextExpandedPaths = expandedPaths.reduce( // delay this on row callback
      (obj, path) => {
         obj[path] = true;
         return obj;
      },
      {...prevExpandedPaths},
   );
   
   if (!disableAutoExpandToPath) {
      nextExpandedPaths.pending = nextExpandedPaths.pending || [];
      for (const path in nextExpandedPaths) {
         nextExpandedPaths.pending.push(
            () => {
               const keyPaths = path.split('.');
               let currentPath = null;
               const nextObj = {};
               keyPaths.forEach(keyPath => {
                  if (currentPath) {
                     currentPath = `${currentPath}.${keyPath}`;
                  } else {
                     currentPath = keyPath;
                  }
                  
                  if (!nextExpandedPaths[currentPath]) {
                     nextObj[currentPath] = true;
                  }
               });
               return nextObj;
               // console.log(path, obj);
            }
         );
      }
   }
   
   
   return nextExpandedPaths;
};
