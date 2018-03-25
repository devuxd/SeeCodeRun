import React from 'react';

import PropTypes from 'prop-types';

import {ObjectInspector, TableInspector, DOMInspector} from 'react-inspector';

import {isNode} from '../utils/scrUtils';

const Inspector = ({ table = false, data, windowRef,...rest }) => {
  if (table) {
    return <TableInspector data={data} {...rest} />;
  }

  if (isNode(data, windowRef)) return <DOMInspector data={data} {...rest} />;

  return <ObjectInspector data={data} {...rest} />;
};

Inspector.propTypes = {
  data: PropTypes.any,
  name: PropTypes.string,
  table: PropTypes.bool,
};


class ObjectExplorer extends React.Component {
  // static expressions = {};
  expandPathsState = {};
  state = {expandPaths: []};
  // handleChange = (handleChange, objectNodeRenderer) => {
  //   return () => {
  //     this.setState({expandPaths: objectNodeRenderer.getExpandedPaths(this.expandPathsState)});
  //     handleChange && handleChange();
  //   }
  // };

  render() {
    const {theme, data, objectNodeRenderer, hideLiveRefs, expressionId, handleChange, ...rest} = this.props;
    // const {expandPaths} = this.state;
    // if (expressionId) {
    //   if (ObjectExplorer.expressions[expressionId]) {
    //     this.expandPathsState = ObjectExplorer.expressions[expressionId];
    //   } else {
    //     ObjectExplorer.expressions[expressionId] = this.expandPathsState;
    //   }
    // }
    // this.expandPathsState = {};
    objectNodeRenderer.expandPathsState = this.expandPathsState;
    //  objectNodeRenderer.handleChange = this.handleChange(handleChange, objectNodeRenderer);
    objectNodeRenderer.hideLiveRefs = hideLiveRefs;
    const liveRef = objectNodeRenderer.parseLiveRefs(data, objectNodeRenderer.hideLiveRefs); // shallow copy fix global setting
    return <Inspector theme={theme}
                      key={expressionId}
                      data={liveRef.data}
                      nodeRenderer={objectNodeRenderer.render}
                      windowRef={objectNodeRenderer.getWindowRef()}
      // expandPaths={expandPaths}
                      {...rest}
    />;
  }
}

export default ObjectExplorer;
