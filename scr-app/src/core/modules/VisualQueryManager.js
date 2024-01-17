import isArray from 'lodash/isArray';

export class VisualQueryManager {
   static visualElementsApiNames = [];
   static visualElements = [];
   static visualQuery = [];
   static getVisualIdsFromRefs = refsArray => {
      if (isArray(refsArray) && isArray(VisualQueryManager.visualElements)) {
         return refsArray.map(
            ref => VisualQueryManager.visualElements.indexOf(ref)
         ).filter(
            e => (-1 < e)
         );
      } else {
         return [];
      }
   };
   static isGraphicalElementSelected = (domEl, visualQuery) => (
      visualQuery || VisualQueryManager.visualQuery
   ).includes(
      domEl
   );
   static onChange = (newVisualQuery = [], visualIds, action = null) => {
      //set on Pastebin's constructor
   };
};
