import {
    useState,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import {connect} from 'react-redux';
import {configureFirecoPersistableComponent} from '../redux/modules/fireco';

const mapDispatchToProps = {configureFirecoPersistableComponent};

//defaults to {} for data, place data within this object
export function usePersistence(firebaseRef, onError) {
    const [pending, setPending] = useState(null);
    const [data, setData] = useState({});
    const changeData = useCallback(
        newValue => {
            if (!firebaseRef) {
                return setPending(newValue);
            }

            firebaseRef.set(newValue).catch(onError);
        },
        [firebaseRef, onError]
    );

    useEffect(
        () => {
            if (firebaseRef && pending) {
                changeData(pending);
                setPending(null);
            }

            return () => null;
        },
        [firebaseRef, pending, changeData]
    );

    useEffect(() => {
            if (!firebaseRef) {
                return () => null;
            }

            const onValue = (snapshot) => {
                setData(snapshot.val() ?? {});
            };

            firebaseRef.on('value', onValue);

            return () => {
                firebaseRef.off('value', onValue);
            };
        },
        [firebaseRef]
    );

    return [data, changeData];
}

const WithFirecoPersistence = (DataComponent) => {
    return ({
                persistablePath,
                onError,
                configureFirecoPersistableComponent,
                ...rest
            }) => {

        const firebaseVarsRef = useRef({
            firebaseRef: null,
            serverTimestamp: () => null
        });

        const [isPersistenceReady, setIsPersistenceReady] = useState(false);

        const onFirecoActive = useCallback(
            (firebaseRef, serverTimestamp) => {
                firebaseVarsRef.current = {firebaseRef, serverTimestamp};
                setIsPersistenceReady(true);
            },
            []
        );

        const {firebaseRef, serverTimestamp} = firebaseVarsRef.current;

        const [
            data, changeData
        ] = usePersistence(firebaseRef, onError);

        useEffect(() => {
                if (!persistablePath || !configureFirecoPersistableComponent) {
                    return () => null;
                }

                configureFirecoPersistableComponent(
                    persistablePath, onFirecoActive
                );

                return () => {
                    setIsPersistenceReady(false);
                };
            },
            [
                persistablePath, configureFirecoPersistableComponent,
                onFirecoActive
            ]
        );

        const props = {
            SERVER_TIMESTAMP: serverTimestamp(),
            isPersistenceReady,
            data,
            changeData,
            persistablePath,
            ...rest, // overridable
        };

        // console.log("PP", {props});

        return <DataComponent {...props}/>;
    };
};

export default function withPersistence(DataComponent) {
    return connect(
        null, mapDispatchToProps)(WithFirecoPersistence(DataComponent)
    );
}
