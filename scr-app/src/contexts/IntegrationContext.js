import {createContext, useContext, useReducer} from 'react';

// abstract model-viewModel integration
export function withIntegrator(
    {
        DataContext, initialData, // React state object, and object with data
        // ComponentContext, actionMapper, // React component object, and object with actions // there is as need for signature enforcement for action usage
        // // component suspense handle data-level constraints (server data download), and event handlers set component-level limitations (refresh, transition)
        DispatchContext, actionReducer // React function object, and function to map dispatch-able actions to data update reductions
    }
) {
    return function IntegrationProvider({children}) { // concrete integration with view
        // concrete model-viewModel integration
        const [
            data, // concrete model
            dispatch    // concrete viewModel
        ] = useReducer(
            actionReducer, // abstract viewModel
            initialData  // abstract model
        );

        return (
            <DataContext.Provider value={data}>
                {/*<ComponentContext.Provider value={dispatch}>*/}
                    <DispatchContext.Provider value={dispatch}>
                        {children}
                    </DispatchContext.Provider>
                {/*</ComponentContext.Provider>*/}
            </DataContext.Provider>
        );
    }
}

// export function IntegrationProvider({children}) {
//     const [integration, dispatch] = useReducer(
//         actionReducer,
//         initialData
//     );
//
//     return (
//         <DataContext.Provider value={integration}>
//             <DispatchContext.Provider value={dispatch}>
//                 {children}
//             </DispatchContext.Provider>
//         </DataContext.Provider>
//     );
// }

// Model(Data Context)-View(Component: Data, Action Props, UI State constrained by context data, UI event limits dispatch triggering)-ViewModel(Dispatch Context)
// sample abstract model start-point
const initialData = [
    {id: 0, text: 'Philosopher’s Path', done: true},
    {id: 1, text: 'Visit the temple', done: false},
    {id: 2, text: 'Drink matcha', done: false}
];

// sample abstract view-model start-point
function actionReducer(integration, action) {
    switch (action.type) {
        case 'added': {
            return [...integration, {
                id: action.id,
                text: action.text,
                done: false
            }];
        }
        case 'changed': {
            return integration.map(t => {
                if (t.id === action.task.id) {
                    return action.task;
                } else {
                    return t;
                }
            });
        }
        case 'deleted': {
            return integration.filter(t => t.id !== action.id);
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}

//sample contexts creation: model-viewModel concrete interface
const DataContext = createContext(null);
const DispatchContext = createContext(null);


//sample abstract usage model end-point
export function useIntegration() {
    return useContext(DataContext);
}

// sample abstract usage viewModel end-point
export function useIntegrationDispatch() {
    return useContext(DispatchContext);
}

// import {
// DataContext, DispatchContext, actionReducer, initialData
// } from './IntegrationContext.js';
//

//integrating MVVM: instantiation
const IntegrationProvider = withIntegrator(
    {
        DataContext, initialData,
        DispatchContext, actionReducer,

    });


// view integration:
function AddTask() {
    const tasks = useIntegration();
    const dispatch = useIntegrationDispatch();
    const task = tasks[0];
    return (
        <input
            value={task.text}
            onChange={e => {
                dispatch({
                    type: 'changed',
                    task: {
                        ...task,
                        text: e.target.value
                    }
                });
            }}/>
    );
}

//integrating MVVM: injection
function TaskApp() {
    return (
        <IntegrationProvider>
            <h1>Day off in Kyoto</h1>
            <AddTask/>
            {/*<TaskList/>*/}
        </IntegrationProvider>
    );
}
