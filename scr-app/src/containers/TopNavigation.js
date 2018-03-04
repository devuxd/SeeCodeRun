// import NavigationBar from './components/navigationBar';
import TopNavigationBar from '../components/TopNavigationBar';
import React, {Component} from 'react';
import PropTypes from "prop-types";

class TopNavigation extends Component{

  render(){
    return <TopNavigationBar />;
  }

}

TopNavigation.contextTypes = {
  store: PropTypes.object.isRequired
}

export default TopNavigation;
