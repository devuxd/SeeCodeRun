import {createContext, useContext} from 'react';

const PastebinContext = createContext({});

export const usePastebinContext = ()=> useContext(PastebinContext);

// export const PastebinProvider = ({children}) => (
//     <PastebinContext.Consumer value={{}}>
//         {children}
//     </PastebinContext.Consumer>
// );

export const withPastebinContext = (Component)=> props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <Component {...context} {...props} />
        }}
    </PastebinContext.Consumer>
);

export default PastebinContext;
