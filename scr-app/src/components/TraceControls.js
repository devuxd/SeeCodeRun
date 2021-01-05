import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

import SpeedDial from '@material-ui/core/SpeedDial';
import SpeedDialIcon from '@material-ui/core/SpeedDialIcon';
import SpeedDialAction from '@material-ui/core/SpeedDialAction';
import SettingsIcon from '@material-ui/icons/SettingsSharp';
import TimerIcon from '@material-ui/icons/Timer';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';
import CodeIcon from '@material-ui/icons/Code';
import PencilIcon from 'mdi-material-ui/Pencil';

import {alpha, withStyles} from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import ListItem from '@material-ui/core/ListItem';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';

import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {requireConfig} from '../seecoderun/modules/AutoLog';
import withPersistence from '../containers/withPersistence';

const onDependenciesChange = async () => {
    await requireConfig.configureDependencies(requireConfig);
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
            {
                key: `async:${dep}`,
                name: dep,
                url: requireConfig.asyncDependencies[dep],
                isDuped,
                isAsync
            });
    });
    return codeBundlingDeps;
};

let iconStyle = {};

const styles = theme => {
    iconStyle = {
        fontSize: Math.floor(theme.typography.fontSize * 1.75),
    };
    return {
        speedDialBackdrop: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            marginLeft: theme.spacing(-2),
            marginBottom: theme.spacing(-2),
            fontSize: theme.spacing(0.5),
            zIndex: theme.zIndex.snackbar,
        },
        speedDial: {
            position: 'absolute',
            zIndex: theme.zIndex.snackbar,
            right: 104,
            top: 5,
        },
        speedDialNavigationToggled: {
            position: 'absolute',
            zIndex: theme.zIndex.snackbar,
            right: 0,
            top: 0,
            marginRight: theme.spacing(-1),
        },
        speedDialFab: {
            color: theme.palette.action.active,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:hover': {
                backgroundColor: alpha(
                    theme.palette.action.active,
                    theme.palette.action.hoverOpacity
                ),
                // Reset on touch devices, it doesn't add specificity
                '@media (hover: none)': {
                    backgroundColor: 'transparent',
                },
            },
        },
        list: {
            paddingTop: 0,
            paddingBottom: 0,
        },
        bundleList: {
            minWidth: 600,
            maxHeight: 800,
        }
    }
};


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
        icon: <PencilIcon/>, name: 'Change history'
    },
];

class TraceControls extends PureComponent {
    state = {
        open: false,
        hidden: false,
        anchorEl: null,
        actionId: null,
        autorunDelay: null,
        codeBundlingDeps: [],
        handleChangeAutorunDelay: null,
        isData: false,
        isCodeBundlingDeps: false,
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
                    data.current.dependencies || {
                        ...requireConfig.dependencyOverrides,
                        count: 0
                    };
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
                nextState.isCodeBundlingDeps = true;
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
                {
                    ...this.props.data.current,
                    dependencyOverrides: dependencyOverrides
                }
            );
        } else {
            requireConfig.dependencyOverrides = dependencyOverrides;
            this.onDependenciesChange();
        }
        this.subject.next({});
    };

    render() {
        const {classes, isTopNavigationToggled} = this.props;
        const {
            // hidden,
            open,
            anchorEl,
            actionId,
            codeBundlingDeps,
            autorunDelay,
            handleChangeAutorunDelay,
        } = this.state;
        //console.log(codeBundlingDeps);
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
                <SpeedDial
                    ariaLabel="seeCode.run configuration"
                    className={
                        isTopNavigationToggled ?
                            classes.speedDialNavigationToggled
                            : classes.speedDial
                    }
                    classes={{fab: classes.speedDialFab}}
                    hidden={false} //hidden
                    icon={<SpeedDialIcon
                        icon={<SettingsIcon style={iconStyle}/>}
                    />}
                    onBlur={this.handleClose}
                    onClick={this.handleClick}
                    onClose={this.handleClose}
                    onFocus={this.handleOpen}
                    onMouseEnter={this.handleOpen}
                    onMouseLeave={this.handleClose}
                    open={open}
                    direction={"down"}
                    FabProps={{
                        size: isTopNavigationToggled ? "small" : "medium",
                    }}
                >
                    {actions.filter(action => action.id).map(action => (
                        <SpeedDialAction
                            key={action.id}
                            icon={action.icon}
                            tooltipTitle={action.name}
                            onClick={
                                (event) => this.handleAction(action.id, event)
                            }
                            aria-owns={
                                anchorEl ?
                                    `trace-controls-menu-${actionId}`
                                    : null
                            }
                            aria-haspopup="true"
                        />
                    ))}
                </SpeedDial>
                <Menu
                    MenuListProps={menuClass}
                    id={`trace-controls-menu-${actionId}`}
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onMouseEnter={this.handleOpen}
                    onMouseLeave={this.handleClose}
                    onClose={this.handleMenuClose}
                >
                    {menuContent}
                </Menu>
            </div>
        );
    }

    onDependenciesChange = () => {
        onDependenciesChange()
            .then(codeBundlingDeps => this.setState({
                codeBundlingDeps,
            }));
    };

    componentDidMount() {
        requireConfig.on && this.onDependenciesChange();
        requireConfig.onDependenciesChange = this.onDependenciesChange;
        this.subject = new Subject();
        this.subject
            .pipe(debounceTime(1000))
            .subscribe(() => (requireConfig.triggerChange && requireConfig.triggerChange()));
    }

    componentDidUpdate(prevProps, prevState/*, snapshot*/) {
        const {isCodeBundlingDeps, open} = this.state;
        if (!prevState.open && open) {
            this.handleVisibility(true)
        } else {
            if (prevState.open && !open) {
                this.handleVisibility(false)
            }
        }

        if (!prevState.isCodeBundlingDeps && isCodeBundlingDeps) {
            this.setState({
                isCodeBundlingDeps: false,
            });
            this.onDependenciesChange();
        }
    }

    componentWillUnmount() {
        requireConfig.onDependenciesChange = null;
        this.subject.complete();
    }
}

TraceControls.propTypes = {
    hideDelay: PropTypes.number,
    data: PropTypes.object,
    changeData: PropTypes.func.isRequired,
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

export default withPersistence(withStyles(styles)(TraceControls));
