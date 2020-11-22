import React, {Component, useState, useEffect} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {configureFirecoPersistableComponent} from '../redux/modules/fireco';

const mapDispatchToProps = {configureFirecoPersistableComponent};

export function usePersistence(firebaseRef, defaultValue, onError) {
    const [data, setLocalValue] = useState(defaultValue);
    const changeData = newValue => firebaseRef.set(newValue).catch(onError);
    useEffect(() => {
        const onValue = (snapshot) => {
            setLocalValue(snapshot.val());
        };
        firebaseRef.on('value', onValue);
        return () => {
            firebaseRef.off('value', onValue);
        };
    }, [firebaseRef]);

    return [data, changeData];
}

let SERVER_TIMESTAMP = null;
export default function withPersistence(DataComponent) {

    class WithPersistence extends Component {
        static propTypes = {
            persistablePath: PropTypes.string.isRequired,
        };

        static defaultProps = {};
        state = {
            data: null
        };

        data = {current: null};
        firebaseRef = null;

        render() {
            this.data.current = this.state.data;
            return <DataComponent
                SERVER_TIMESTAMP={SERVER_TIMESTAMP} data={this.data} changeData={this.changeData} {...this.props}
            />;

        }

        onValue = (snapshot) => {
            const data = snapshot.val() || {};
            this.setState({data});
        };

        changeData = (data) => {
            return this.firebaseRef && this.firebaseRef.set(data);
        };

        onFirecoActive = (firebaseRef, TIMESTAMP) => {
            this.firebaseRef = firebaseRef;
            SERVER_TIMESTAMP = TIMESTAMP;
            this.firebaseRef.on('value', this.onValue);
        };

        onDispose = () => {
            this.firebaseRef && this.firebaseRef.off('value', this.onValue);
            this.firebaseRef = null;
        };

        componentDidMount() {
            const {persistablePath, configureFirecoPersistableComponent} = this.props;
            persistablePath &&
            configureFirecoPersistableComponent(persistablePath, this.onFirecoActive, this.onDispose);
        }

        componentWillUnmount() {
            this.onDispose();
        }

    }

    return connect(null, mapDispatchToProps)(WithPersistence);
}