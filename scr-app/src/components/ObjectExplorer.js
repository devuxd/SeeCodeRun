import React from 'react';
import PropTypes from 'prop-types';
import MyLocationIcon from 'material-ui-icons/MyLocation'
import {ObjectInspector, TableInspector, DOMInspector} from 'react-inspector';
import {Tooltip} from 'material-ui';
import deepDiff from 'deep-diff';

import {isNode} from '../utils/scrUtils';
import {ThemeContext} from '../pages/Index';

const noop = () => {
};

class OutputElementHover extends React.Component {
  state = {
    originalStyle: null,
    style: null,
  };
  handleEnter = el => {
    if (el.style) {
      return () => {
        this.setState({
          style: {
            border: '1px solid orange'
          },
          originalStyle: this.state.originalStyle || {
            border: el.style.border
          }
        });
      };
    } else {
      return noop;
    }
  };

  handleLeave = el => {
    if (el.style) {
      return () => {
        this.setState({
          style: this.state.originalStyle,
        });
      };
    } else {
      return noop;
    }
  };

  render() {
    const {el, children} = this.props;
    const {style} = this.state;
    style && (el.style.border = style.border);
    return <div onMouseEnter={this.handleEnter(el)} onMouseLeave={this.handleLeave(el)}>{children}</div>;
  }
}

OutputElementHover.propTypes = {
  el: PropTypes.object.isRequired,
};

export const Inspector = ({table = false, data, windowRef, nodeRenderer, ...rest}) => {

  return <ThemeContext.Consumer>
    {context => {
      const {inspectorTheme} = context;

      if (table) {
        return <TableInspector theme={inspectorTheme} data={data} {...rest} />;
      }

      if (isNode(data, windowRef)) {
        return <OutputElementHover el={data}>
          <Tooltip title="Locating in Browser" placement="right">
            <div style={{position: 'relative'}}>
        <span style={{position: 'absolute', top: 0, color: 'grey', marginLeft: -15}}>
          <MyLocationIcon style={{fontSize: 15}}/>
        </span>
              <DOMInspector theme={inspectorTheme} data={data} {...rest} />
            </div>
          </Tooltip>
        </OutputElementHover>;
      }

      return <ObjectInspector theme={inspectorTheme} data={data} nodeRenderer={nodeRenderer} {...rest} />

    }}
  </ThemeContext.Consumer>;
};

Inspector.propTypes = {
  data: PropTypes.any,
  name: PropTypes.string,
  table: PropTypes.bool,
};

const diffToExpandPaths = (prevData, data) => {
  return (deepDiff(prevData, data) || []).map(change => {
    return change.path ? change.path.reduce((a, c) => `${a}.${c}`, '$') : '$';
  });
};

class ObjectExplorer extends React.Component {
  state = {
    isInit: false,
    prevData: null,
    expandPaths: [],
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const {data} = nextProps;
    const {prevData} = prevState;

    if (data === prevData) {
      return null;
    }

    return {
      isInit: true,
      prevData: data,
      expandPaths: prevState.isInit ? diffToExpandPaths(prevData, data) : []
    };
  }

  render() {
    const {theme, data, objectNodeRenderer, expressionId, handleChange, ...rest} = this.props;
    const {expandPaths} = this.state;
    const liveRef = objectNodeRenderer.parseLiveRefs(data);
 //   console.log(expandPaths);
    return <Inspector
      key={expressionId}
      data={liveRef.data}
      nodeRenderer={objectNodeRenderer.render}
      windowRef={objectNodeRenderer.getWindowRef()}
      showNonenumerable={false}
      expandPaths={expandPaths}
      {...rest}
    />;
  }
}

export default ObjectExplorer;
