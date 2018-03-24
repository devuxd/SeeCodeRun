import React from 'react';

import {Inspector} from 'react-inspector';

class ObjectExplorer extends React.Component {

  render() {
    const {theme, data, objectNodeRenderer,rest} = this.props;
    return <Inspector theme={theme} data={data} nodeRenderer={objectNodeRenderer} {...rest} />;
  }
}

export default ObjectExplorer;
