// based on react-grid-layout's WidthProvider
import React, {Component} from "react";
import ReactDOM from "react-dom";

/*
 * A simple HOC that provides facility for listening to container resizes.
 */
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

    componentDidMount() {
      this.mounted = true;

      window.addEventListener("resize", this.onWindowResize);
      // Call to properly set the breakpoint and resize the elements.
      // Note that if you're doing a full-width element,
      // this can get a little wonky if a scrollbar
      // appears because of the grid. In that case,
      // fire your own resize event, or set `overflow: scroll` on your body.
      this.onWindowResize();
    }

    componentWillUnmount() {
      this.mounted = false;
      window.removeEventListener("resize", this.onWindowResize);
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

    componentWillReceiveProps(newProps) {
      const {onHeight, heightAdjust} = newProps;
      if (onHeight && this.onHeight !== onHeight) {
        this.onHeight = onHeight;
      }
      this.heightAdjust = heightAdjust;
      this.onWindowResize();
    }

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
