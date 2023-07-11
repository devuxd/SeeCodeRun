import React, {Suspense, useMemo, useState, useEffect,} from 'react';
import PropTypes from 'prop-types';
import {requestAnimationFrameWhenIdle} from "../utils/renderingUtils";

let importedChat = null;
const SuspenseChat = (props) => {
    const ImportedChat = useMemo(
        () => (importedChat ??= React.lazy(() => import('./Chat'))),
        []
    );

    return (
        <Suspense fallback={<h5>Loading Chat...</h5>}>
            <ImportedChat {...props}/>
        </Suspense>
    );
};

const DeferredUntilIdleLazyChat = (
    {
        loadChat = false,
        loadChatDelay = 10000,
        isUserAction = false,
        ...props
    }
) => {
    const [activateChat, setActivateChat] = useState(false);

    useEffect(() => {
            if (activateChat) {
                return () => null;
            }

            if (isUserAction) {
                setActivateChat(true);
                return () => null;
            }

            if (loadChat) {
                const tid = setTimeout(
                    () => {
                        requestAnimationFrameWhenIdle(
                            () => null
                            , () => setActivateChat(true)
                        )
                    }
                    , loadChatDelay
                );
                return () => clearTimeout(tid);
            }
        },
        [
            isUserAction, loadChat, loadChatDelay,
            activateChat, setActivateChat,
        ]
    );

    return (activateChat && <SuspenseChat {...props}/>);
};

DeferredUntilIdleLazyChat.propTypes = {
    isUserAction: PropTypes.bool,
    loadChat: PropTypes.bool,
    loadChatDelay: PropTypes.number,
};

export default DeferredUntilIdleLazyChat;
