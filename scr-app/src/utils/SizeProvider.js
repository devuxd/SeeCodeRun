// based on react-grid-layout's WidthProvider
import React, {Component} from "react";
import PropTypes from 'prop-types';
import ReactDOM from "react-dom";
import {fromEvent} from 'rxjs/observable/fromEvent';

export default function SizeProvider(ComposedComponent) {
    return class SizeProvider extends Component {
        static defaultProps = {
            measureBeforeMount: false
        };

        static propTypes = {
            onHeight: PropTypes.func,
            heightAdjust: PropTypes.number,
        };


        state = {
            domNode: null,
            width: 1280,
            height: 1024,
        };

        mounted = false;
        windowResizeSubscription = null;

        componentDidMount() {
            this.mounted = true;
            this.windowResizeSubscription =
                fromEvent(window, 'resize')
                    .subscribe(() => this.onWindowResize());
            this.onWindowResize();
        }

        componentWillUnmount() {
            this.mounted = false;
            this.windowResizeSubscription.unsubscribe();
        }

        onWindowResize = () => {
            if (!this.mounted) return;
            const node = ReactDOM.findDOMNode(this);
            if (node instanceof HTMLElement) {
                const {onHeight, heightAdjust} = this.props;
                this.setState({
                    domNode: node,
                    width: node.offsetWidth,
                    height: onHeight ? onHeight(node, heightAdjust || 0) : window.innerHeight
                });
            }
        };

        static getDerivedStateFromProps(nextProps, prevState) {
            if (nextProps.onHeight && prevState.domNode) {
                const height = nextProps.onHeight(prevState.domNode, nextProps.heightAdjust || 0);
                return {height};
            }
            return null
        }

        render() {
            const {measureBeforeMount, ...rest} = this.props;
            if (measureBeforeMount && !this.mounted) {
                return (
                    <div className={this.props.className} style={this.props.style}/>
                );
            }
            return <ComposedComponent {...rest} {...this.state} />;
        }

    };
}
