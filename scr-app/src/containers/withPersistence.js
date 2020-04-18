import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {configureFirecoPersistableComponent} from '../redux/modules/fireco';

const mapDispatchToProps = {configureFirecoPersistableComponent};

export default function withPersistence(DataComponent) {

    class PersistentComponent extends Component {
        static propTypes = {
            persistablePath: PropTypes.string.isRequired,
        };

        static defaultProps = {};
        SERVER_TIMESTAMP = null;
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
            this.SERVER_TIMESTAMP = TIMESTAMP;
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

    return connect(null,mapDispatchToProps)(PersistentComponent);
}