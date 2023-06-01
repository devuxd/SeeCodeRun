import {createContext} from 'react';
import {
   Inspector,
   ObjectName,
   ObjectValue,
   useStyles
} from 'react-inspector';

import GraphicalQueryBase from "./GraphicalQueryBase";
import {VisualQueryManager} from "../VisualQueryManager";

const ALEContext = createContext({
   Inspector,
   ObjectName,
   ObjectValue,
   useStyles,
   GraphicalQuery:GraphicalQueryBase,
   aleInstance: null,
   setAleInstance: function (aleInstance){
      this.aleInstance = aleInstance;
   },
   activateAleInstance: (monacoEditor, onUnsafeAct)=>{},
   locToMonacoRange: ()=>{},
   // getTheme:()=>null,
   VisualQueryManager,
});




export default ALEContext;
// explaining why leaning barriers
// implication of current work, and topics shoudl be epaliend. Boredn implications, enumarate more directions qhere to run with it.
