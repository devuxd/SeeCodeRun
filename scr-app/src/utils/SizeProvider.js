// based on react-grid-layout's WidthProvider
import React, {createRef, PureComponent} from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

export default function SizeProvider(ComposedComponent) {
    return class SizeProvider extends PureComponent {
        static defaultProps = {
            measureBeforeMount: false
        };

        static propTypes = {
            onHeight: PropTypes.func,
            heightAdjust: PropTypes.number,
        };

        constructor(props) {
            super(props);
            this.state = {
                domNode: null,
                width: 1280,
                height: 1024,
            };
            this.mounted = false;
            this.reactRef = createRef();
        }


        componentDidMount() {
            this.mounted = true;
            this._onWindowResize = debounce(this.onWindowResize, 250, {maxWait: 1000});
            window.addEventListener('resize', this._onWindowResize );
            this.onWindowResize();
        }

        componentWillUnmount() {
            this.mounted = false;
            window.removeEventListener('resize', this._onWindowResize );
            this._onWindowResize.cancel();
        }

        onWindowResize = () => {
            if (!this.mounted || !this.reactRef.current) return;
            const node = this.reactRef.current;
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
            return null;
        }

        render() {
            const {measureBeforeMount, ...rest} = this.props;
            if (measureBeforeMount && !this.mounted) {
                return (
                    <div ref={this.reactRef} className={this.props.className} style={this.props.style}/>
                );
            }
            return (<div ref={this.reactRef}>
                <ComposedComponent {...rest} {...this.state} />
            </div>);
        }

    };
}
