import React, {PureComponent} from 'react';
// import PropTypes from 'prop-types';
// import {withStyles} from '@material-ui/core/styles';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
// import ListItemIcon from '@material-ui/core/ListItemIcon';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';

import FolderIcon from '@material-ui/icons/Folder';
import DeleteIcon from '@material-ui/icons/Delete';

class ExpressionInspector extends PureComponent {
  state = {
    dense: false,
    secondary: false,
  };

  render() {
    const {classes} = this.props;
    const {dense, secondary} = this.state;
    return <List dense={dense}>
      <ListItem>
        <ListItemAvatar>
          <Avatar>
            <FolderIcon/>
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Single-line item"
          secondary={secondary ? 'Secondary text' : null}
        />
        <ListItemSecondaryAction>
          <IconButton aria-label="Delete">
            <DeleteIcon/>
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </List>;
  }
}

export default ExpressionInspector;
