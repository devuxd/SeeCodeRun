import {lazy} from "react";
import {DevSupport} from '@react-buddy/ide-toolbox';
import {useInitial} from "./useInitial";
import ErrorBoundary from "./ErrorBoundary";

export const ComponentPreviews = lazy(() => import("./previews"));

export const DevSupportProvider = ({children}) => {
    return (<DevSupport
            ComponentPreviews={ComponentPreviews}
            useInitialHook={useInitial}
        >
            <div>
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </div>
        </DevSupport>
    );
};
