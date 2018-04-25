import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {configureFirecoPersistableComponent} from '../redux/modules/fireco';

let SERVER_TIMESTAMP = null;

export default function PersistableContainer(DataComponent) {

    return class PersistableContainer extends Component {
        static contextTypes = {
            store: PropTypes.object.isRequired,
        };

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
            if (DataComponent) {
                return <DataComponent data={this.data} changeData={this.changeData} {...this.props} />;
            }
            return null;
        }

        onValue = (snapshot) => {
            const data = snapshot.val() || {};
            this.setState({data});
        };

        changeData = (data) => {
            if (this.firebaseRef) {
                this.firebaseRef.set(data);
            }
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
            const {store} = this.context;
            if (this.props.persistablePath) {
                store.dispatch(configureFirecoPersistableComponent(this.props.persistablePath, this.onFirecoActive, this.onDispose));
            }
        }

        componentWillUnmount() {
            this.onDispose();
        }

    }
}