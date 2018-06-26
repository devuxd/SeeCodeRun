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
import TimerIcon from '@material-ui/icons/Timer';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';
import CodeIcon from '@material-ui/icons/Code';
import EditIcon from '@material-ui/icons/ModeEdit';

import {withStyles} from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import ListItem from '@material-ui/core/ListItem';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import {Subject} from 'rxjs/Subject';

import {requireConfig} from '../seecoderun/modules/AutoLog';

const onDependenciesChange = () => {
    requireConfig.configureDependencies(requireConfig);
    const codeBundlingDeps = [];
    let isAsync = false;
    Object.keys(requireConfig.dependencies).forEach(dep => {
        codeBundlingDeps.push({
            key: `sync:${dep}`,
            name: dep,
            url: requireConfig.dependencies[dep],
            isAsync
        });
    });
    isAsync = true;
    Object.keys(requireConfig.asyncDependencies).forEach(dep => {
        const isDuped = !!codeBundlingDeps.find(d => d.name === dep);
        codeBundlingDeps.push(
            {key: `async:${dep}`, name: dep, url: requireConfig.asyncDependencies[dep], isDuped, isAsync});
    });
    return codeBundlingDeps;
};

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
        marginLeft: -theme.spacing.unit / 2,
        marginBottom: -theme.spacing.unit / 2,
        fontSize: theme.spacing.unit / 2,
        zIndex: theme.zIndex.snackbar,
    },
    speedDial: {
        position: 'absolute',
        bottom: theme.spacing.unit * 3,
        left: theme.spacing.unit * 3,
    },
    list: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    bundleList: {
        minWidth: 600,
        maxHeight: 800,
    }
});


const actions = [
    {
        icon: <TimerIcon/>, name: 'Autorun delay', id: 'autorunDelay',
    },
    {
        icon: <CodeIcon/>, name: 'Code bundling', id: 'codeBundling',
    },
    {
        icon: <PlaylistPlayIcon/>, name: 'Trace history'
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
        autorunDelay: null,
        codeBundlingDeps: [],
        handleChangeAutorunDelay: null,
        isData: false,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        let nextState = {};
        const {data} = nextProps;

        if (nextProps.handleChangeAutorunDelay !== prevState.handleChangeAutorunDelay) {
            nextState.handleChangeAutorunDelay = nextProps.handleChangeAutorunDelay;
        }

        if (data.current) {
            if (isNaN(data.current.autorunDelay) || !data.current.dependencyOverrides) {
                const autorunDelay =
                    isNaN(data.current.autorunDelay) ? nextProps.autorunDelay : data.current.autorunDelay;
                const dependencyOverrides =
                    data.current.dependencies || {...requireConfig.dependencyOverrides, count: 0};
                nextProps.changeData(
                    {
                        ...nextProps.data.current,
                        autorunDelay,
                        dependencyOverrides,
                    });
                return nextState;
            }

            if (data.current.autorunDelay !== nextProps.autorunDelay) {
                if (prevState.isData) {
                    nextProps.changeData(
                        {
                            ...nextProps.data.current,
                            autorunDelay: nextProps.autorunDelay
                        });
                } else {
                    nextProps.handleChangeAutorunDelay(data.current.autorunDelay);
                    nextState.isData = true;
                }

                return nextState;
            } else {
                if (data.current.autorunDelay !== prevState.autorunDelay) {
                    nextState.autorunDelay = data.current.autorunDelay;
                }
            }

            if (data.current.dependencyOverrides !== requireConfig.dependencyOverrides) {
                requireConfig.dependencyOverrides = data.current.dependencyOverrides;
                nextState.codeBundlingDeps = onDependenciesChange();
            }

            return nextState;
        }

        if (nextProps.autorunDelay !== prevState.autorunDelay) {
            nextState.autorunDelay = nextProps.autorunDelay;
        }

        return nextState;
    }

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
            case actions[1].id:
                this.setState({anchorEl: event.currentTarget, actionId});
                break;
            default:
        }
        this.handleClick();
    };
    handleChangeURL = (key, url) => {
        const dep = this.state.codeBundlingDeps.find(dep => dep.key === key);
        if (!dep) {
            return;
        }
        const dependencyOverrides = {...requireConfig.dependencyOverrides};
        dependencyOverrides[dep.name] = url;
        if (this.props.changeData && this.props.data.current) {
            dependencyOverrides.count = Object.keys(dependencyOverrides).length - 1;
            this.props.changeData(
                {...this.props.data.current, dependencyOverrides: dependencyOverrides}
            );
        } else {
            requireConfig.dependencyOverrides = dependencyOverrides;
            this.onDependenciesChange();
        }
        this.subject.next({});
    };

    render() {
        const {classes} = this.props;
        const {
            hidden, open, anchorEl, actionId, codeBundlingDeps, autorunDelay, handleChangeAutorunDelay
        } = this.state;
        // console.log(codeBundlingDeps);
        let menuContent;
        let menuClass = {className: classes.list};
        switch (actionId) {
            case actions[0].id:
                menuContent = <ListItem className={classes.list}>
                    <TextField
                        label="auto-run delay"
                        value={autorunDelay}
                        onChange={event => handleChangeAutorunDelay(event.target.value)}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        margin="normal"
                        fullWidth
                    />
                </ListItem>;
                break;
            case actions[1].id:
                menuContent = codeBundlingDeps.length ? codeBundlingDeps.map(dep => {
                    return <ListItem className={classes.list} key={dep.key}>
                        <TextField
                            error={dep.isDuped}
                            label={dep.name}
                            helperText={`${dep.isAsync ? 'ASYNC IMPORT' : ''} ${dep.isDuped ? '[ERROR] Loaded synchronously, remove one of them.' : ''}`}
                            value={dep.url}
                            onChange={event => this.handleChangeURL(dep.key, event.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin="normal"
                            fullWidth
                        />
                    </ListItem>;
                }) : <MenuItem> No dependencies found in code </MenuItem>;
                menuClass = {className: classes.bundleList};
                break;
            default:
                menuContent = null;
        }

        return (
            <div>
                {hidden && <Button variant="fab"
                                   mini
                                   color="default"
                                   aria-label="seeCode.run configuration"
                                   className={classes.speedDialBackdrop}
                                   onClick={() => this.handleVisibility(true)}
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
                    MenuListProps={menuClass}
                    id={`trace-controls-menu-${actionId}`}
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                >
                    {menuContent}
                </Menu>
            </div>
        );
    }

    onDependenciesChange = () => {
        this.setState({
            codeBundlingDeps: onDependenciesChange(),
        });
    };

    componentDidMount() {
        requireConfig.on && this.onDependenciesChange();
        requireConfig.onDependenciesChange = this.onDependenciesChange;
        this.subject = new Subject();
        this.subject
            .debounceTime(1000)
            .subscribe(() => (requireConfig.triggerChange && requireConfig.triggerChange()));
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

    componentWillUnmount() {
        requireConfig.onDependenciesChange = null;
        this.subject.complete();
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
