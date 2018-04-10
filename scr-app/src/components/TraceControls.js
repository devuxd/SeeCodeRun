import React from 'react';
import PropTypes from 'prop-types';
// webpack tree shacking is broken for reimports
// import {withStyles, Menu, ListItem, TextField, Button} from 'material-ui';
// import {SpeedDial, SpeedDialIcon, SpeedDialAction} from '@material-ui/lab';
// import {
//     Settings as SettingsIcon,
//     PlayArrow as PlayArrowIcon,
//     PlaylistPlay as PlaylistPlayIcon,
//     Code as CodeIcon,
//     Edit as EditIcon,
// } from '@material-ui/icons';


import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import SettingsIcon from '@material-ui/icons/Settings';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';
import CodeIcon from '@material-ui/icons/Code';
import EditIcon from '@material-ui/icons/ModeEdit';

import {withStyles} from 'material-ui/styles';
import Menu from 'material-ui/Menu';
import {ListItem} from 'material-ui/List';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';

const styles = theme => ({
    speedDialBackdrop: {
        // backgroundColor: 'transparent',
        position: 'absolute',
        // width: theme.spacing.unit * 9,
        // height: theme.spacing.unit * 9,
        // width: theme.spacing.unit,
        // height: theme.spacing.unit,
        bottom: 0,
        left: 0,
        fontSize: theme.spacing.unit / 2,
        zIndex: theme.zIndex.snackbar,
    },
    speedDial: {
        position: 'absolute',
        bottom: theme.spacing.unit * 4,
        left: theme.spacing.unit * 4,
    },
    list: {
        paddingTop: 0,
        paddingBottom: 0,
    }
});


const actions = [
    {
        icon: <PlayArrowIcon/>, name: 'Autorun delay', id: 'autorunDelay',
    },
    {
        icon: <PlaylistPlayIcon/>, name: 'Trace history'
    },
    {
        icon: <CodeIcon/>, name: 'Code bundling'
    },
    {
        icon: <EditIcon/>, name: 'Change history'
    },
];

class TraceControls extends React.Component {
    state = {
        open: false,
        hidden: true,
        anchorEl: null,
        actionId: null,
    };

    handleVisibility = (isVisible) => {

        if (isVisible) {
            clearTimeout(this.tms);
            this.setState({
                hidden: false,
            });

        } else {
            clearTimeout(this.tms);
            this.tms = setTimeout(
                () => {
                    this.setState({
                        hidden: !this.state.open,
                    });
                }
                , this.props.hideDelay);

        }
    };

    handleClick = () => {
        this.setState(prevState => ({
            open: !prevState.open,
        }));
    };

    handleOpen = () => {
        if (!this.state.hidden) {
            this.setState({
                open: true,
            });
        }
        this.handleVisibility(true);
    };

    handleClose = () => {
        this.setState({
            open: false,
        });
        this.handleVisibility(false);
    };

    handleMenuClose = () => {
        this.setState({anchorEl: null});
    };

    handleAction = (actionId, event) => {
        switch (actionId) {
            case actions[0].id:
                this.setState({anchorEl: event.currentTarget, actionId});
                break;
            default:
        }
        this.handleClick();
    };

    render() {
        const {classes, autorunDelay, handleChangeAutorunDelay} = this.props;
        const {hidden, open, anchorEl, actionId} = this.state;

        return (
            <div>
                {hidden && <Button variant="fab"
                                   mini
                                   color="default"
                                   aria-label="seeCode.run configuration"
                                   className={classes.speedDialBackdrop}
                                   onMouseEnter={() => this.handleVisibility(true)}
                                   onMouseLeave={() => this.handleVisibility(false)}
                > <SettingsIcon/></Button>}
                {!hidden && <SpeedDial
                    ariaLabel="seeCode.run configuration"
                    className={classes.speedDial}
                    hidden={hidden}
                    icon={<SpeedDialIcon icon={<SettingsIcon/>}/>}
                    onBlur={this.handleClose}
                    onClick={this.handleClick}
                    onClose={this.handleClose}
                    onFocus={this.handleOpen}
                    onMouseEnter={this.handleOpen}
                    onMouseLeave={this.handleClose}
                    open={open}
                >
                    {actions.filter(action => action.id).map(action => (
                        <SpeedDialAction
                            key={action.id}
                            icon={action.icon}
                            tooltipTitle={action.name}
                            onClick={(event) => this.handleAction(action.id, event)}
                            aria-owns={anchorEl ? `trace-controls-menu-${actionId}` : null}
                            aria-haspopup="true"
                        />
                    ))}
                </SpeedDial>}
                <Menu
                    MenuListProps={{className: classes.list}}
                    id={`trace-controls-menu-${actionId}`}
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}

                >
                    <ListItem className={classes.list}>
                        <TextField
                            label="auto-run delay"
                            value={autorunDelay}
                            onChange={event => handleChangeAutorunDelay(event.target.value)}
                            type="number"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin="normal"
                        />
                    </ListItem>
                </Menu>
            </div>
        );
    }

    componentDidUpdate(prevProps, prevState/*, snapshot*/) {
        if (!prevState.open && this.state.open) {
            this.handleVisibility(true)
        } else {
            if (prevState.open && !this.state.open) {
                this.handleVisibility(false)
            }
        }
    }
}

TraceControls.propTypes = {
    hideDelay: PropTypes.number,
    classes: PropTypes.object.isRequired,
    autorunDelay: PropTypes.number,
    handleChangeAutorunDelay: PropTypes.func,
};

TraceControls.defaultProps = {
    hideDelay: 1500,
    autorunDelay: 0,
    handleChangeAutorunDelay: () => {
    },
};

export default withStyles(styles)(TraceControls);
