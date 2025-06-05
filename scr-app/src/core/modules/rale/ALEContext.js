import {createContext} from 'react';
// import {
//     Inspector,
//     ObjectName,
//     ObjectValue,
//     useStyles
// } from 'react-inspector';
//
// import GraphicalQueryBase from "./GraphicalQueryBase";
// import {VisualQueryManager} from "../VisualQueryManager";
// // import {withIntegrator} from "../../../contexts/IntegrationContext";
// const initialAleContext = {
//     Inspector,
//     ObjectName,
//     ObjectValue,
//     useStyles,
//     GraphicalQuery: GraphicalQueryBase,
//     aleInstance: null,
//     // getTheme:()=>null,
//     VisualQueryManager,
// };
//
// initialAleContext.setAleInstance = (aleInstance) => {
//     initialAleContext.aleInstance = aleInstance;
// };
//
// initialAleContext.activateAleInstance = () => {
// };
// initialAleContext.locToMonacoRange = () => {
// };

const ALEContext = createContext({});//initialAleContext

// const initialData = {
//    Inspector,
//    ObjectName,
//    ObjectValue,
//    useStyles,
//    GraphicalQuery:GraphicalQueryBase,
//    aleInstance: null,
//    setAleInstance: function (aleInstance){
//       this.aleInstance = aleInstance;
//    },
//    activateAleInstance: (firecoPad, onUnsafeAct)=>{},
//    locToMonacoRange: ()=>{},
//    // getTheme:()=>null,
//    VisualQueryManager,
// };
//
// const actionReducer =(ale, action) =>{
//    const {type, aleInstance} = action;
//    switch (action.type) {
//       case 'instance-added': {
//          return {...ale, aleInstance};
//       }
//       case 'changed': {
//          return ;
//       }
//       case 'deleted': {
//          return ;
//       }
//       default: {
//          throw Error(`Unknown ALE action:  ${type}`);
//       }
//    }
// };


// const ALEProvider = withIntegrator();
export default ALEContext;
// explaining why leaning barriers
// implication of current work, and topics shoudl be epaliend. Boredn implications, enumarate more directions qhere to run with it.
