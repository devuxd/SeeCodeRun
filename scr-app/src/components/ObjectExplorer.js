import React from 'react';

import {Inspector} from 'react-inspector';

class ObjectExplorer extends React.Component {

  render() {
    const {theme, data, ...rest} = this.props;
    return <Inspector  theme={theme} data={data} {...rest} />;
  }
}

export default ObjectExplorer;
