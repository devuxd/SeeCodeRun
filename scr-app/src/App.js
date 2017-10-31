import React, { Component } from 'react';
import {Container} from 'reactstrap';


class App extends Component {
  render() {
    return (
      <Container fluid={true} className="App">
        <div id="navigationBar" ></div>
        <div id="pastebin" ></div>
      </Container>
    );
  }
}

export default App;
