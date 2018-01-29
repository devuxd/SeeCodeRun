import React from 'react';

import {Inspector} from 'react-inspector';

class ObjectExplorer extends React.Component {

  render() {
    const {data} = this.props;
    return <Inspector  data={data}/>;
  }
}

export default ObjectExplorer;
