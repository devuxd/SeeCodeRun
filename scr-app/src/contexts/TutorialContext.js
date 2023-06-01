import {createContext, useContext, useState, useCallback, useMemo} from 'react';

export const TutorialContext = createContext({});

// const Navigation

const withTutorial = (Component)=>{
   return ({isTutorialActive, ...props})=>{
      const [_isTutorialActive, _setIsTutorialActive] = useState(isTutorialActive);
      isTutorialActive = isTutorialActive ?? _isTutorialActive;
      const toggleIsTutorialActive = useCallback(
         () => {
            _setIsTutorialActive(!isTutorialActive);
         },
         [isTutorialActive]
      );
      
      const context = useMemo(()=>({
         isTutorialActive,
         toggleIsTutorialActive
      }),
         [isTutorialActive, toggleIsTutorialActive]
      );
      
      return (
         <TutorialContext.Provider  value={context}>
            <Component {...props}/>
         </TutorialContext.Provider>
      );
   }
}

export default withTutorial;
