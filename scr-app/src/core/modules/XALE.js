
export default function makeJSXTraverseEnter () {
   const jsxExpressions = [];
   const jsxTraverseEnter = (path) => {
      if (path.type.toUpperCase().includes("JSX")) {
         jsxExpressions.push(path);
      }
   };
   
   const find =(type)=>{
      return jsxExpressions.filter(p=>p.type ===type);
   }
   
   const findJSXElements = ()=>find('JSXElement');
   
   return [
      {
         jsxExpressions,
         find,
         findJSXElements,
   },
      jsxTraverseEnter
   ];
};
