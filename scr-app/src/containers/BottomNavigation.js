import BottomNavigationBar from '../components/bottomNavigationBar'
import React, {Component} from 'react';
import PropTypes from "prop-types";

class BottomNavigation extends Component{

  render(){
    return <BottomNavigationBar />;
  }

}

BottomNavigation.contextTypes = {
  store: PropTypes.object.isRequired
}

export default BottomNavigation;
