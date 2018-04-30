import {Component} from 'react';
import {createPortal} from 'react-dom';
import PropTypes from 'prop-types';

class DOMPortal extends Component {
    constructor(props) {
        super(props);
        this.el = document.createElement(props.component);
    }

    componentDidMount() {
        this.props.parentEl.appendChild(this.el);
    }

    componentWillUnmount() {
        this.props.parentEl.removeChild(this.el);
    }

    render() {
        return createPortal(
            this.props.children,
            this.el,
        );
    }
}

DOMPortal.propTypes = {
    parentEl: PropTypes.object.isRequired,
    component: PropTypes.string,
};

DOMPortal.defaultProps = {
    component: 'div',
};

export default DOMPortal;
