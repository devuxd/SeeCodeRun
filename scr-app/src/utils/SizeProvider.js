// based on react-grid-layout's WidthProvider
import React, {Component} from "react";
import ReactDOM from "react-dom";
import {fromEvent} from 'rxjs/observable/fromEvent';
import {Observable} from 'rxjs/Observable';

export default function SizeProvider(ComposedComponent) {
    return class SizeProvider extends Component {
        static defaultProps = {
            measureBeforeMount: false
        };

        state = {
            width: 1280,
            height: 1024,
        };

        mounted = false;
        onHeight = null;
        heightAdjust = 0;
        observable = null;

        componentDidMount() {
            this.mounted = true;
            this.observable = fromEvent(window, 'resize');
            this.observable
                .throttle(() => Observable.interval(150), {leading: false, trailing: true})
                .subscribe(() => this.onWindowResize());
            this.onWindowResize();
        }

        componentWillUnmount() {
            this.mounted = false;
            this.observable.complete();
        }

        onWindowResize = () => {
            if (!this.mounted) return;
            const node = ReactDOM.findDOMNode(this);
            if (node instanceof HTMLElement) {
                this.setState({
                    width: node.offsetWidth,
                    height: this.onHeight ? this.onHeight(node, this.heightAdjust) : window.innerHeight
                });
            }
        };

        render() {
            const {measureBeforeMount, onHeight, heightAdjust, ...rest} = this.props;
            this.onHeight = onHeight;
            this.heightAdjust = heightAdjust || 0;
            if (measureBeforeMount && !this.mounted) {
                return (
                    <div className={this.props.className} style={this.props.style}/>
                );
            }
            return <ComposedComponent {...rest} {...this.state} />;
        }

    };
}
