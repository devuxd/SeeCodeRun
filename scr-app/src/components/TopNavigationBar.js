import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import ScrIcon from './icons/SCR';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ChatIcon from '@material-ui/icons/Chat';
import ShareIcon from '@material-ui/icons/Share';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import LightbulbOutlineIcon from '@material-ui/icons/LightbulbOutline';
import LightbulbIcon from './icons/Lightbulb';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import {CopyToClipboard} from 'react-copy-to-clipboard';

export const APP_BAR_HEIGHT = 48;
let iconStyle = {};
const lightBulbIconStyle = {};
const scrSvg = {};
const aStyle = {};

const styles = (theme) => {
        iconStyle = {
            fontSize: Math.floor(theme.typography.fontSize * 1.75)
        };

        lightBulbIconStyle.light = {
            color: theme.palette.action.active,
            fontSize: iconStyle.fontSize,
        };
        lightBulbIconStyle.dark = {
            color: theme.palette.secondary.main,
            fontSize: iconStyle.fontSize,
        };

        scrSvg.sticky = {
            color: theme.palette.secondary.main,
            secondaryColor: theme.palette.background.paper,
            fontSize: theme.typography.fontSize * 2,
        };
        scrSvg.logo = {
            color: theme.palette.action.active,
            secondaryColor: theme.palette.background.default,
            fontSize: theme.typography.fontSize * 3,
        };

        aStyle.link = {
            color: theme.palette.action.active,
        };

        return {
            appCompact: {
                minHeight: APP_BAR_HEIGHT,
            },
            scrIconSticky: {
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: theme.zIndex.snackbar,
            },
            scrIcon: {
                marginLeft: theme.spacing.unit,
                marginRight: theme.spacing.unit * 2,
                paddingLeft: theme.spacing.unit,
                paddingRight: theme.spacing.unit,
            },
            flex: {
                flex: 1,
            },
            centered: {
                justifyContent: 'center',
            },
        }
    }
;

class TopNavigationBar extends Component {
    state = {
        infoAnchorEl: null,
        checkedLocked: false,
        checkedJS: false,
        checkedHTML: false,
        checkedCSS: false,
        checkedConsole: false,
        checkedOutput: false,
    };

    handleInfoMenu = event => {
        this.setState({infoAnchorEl: event.currentTarget});
    };

    handleInfoClose = () => {
        this.setState({infoAnchorEl: null});
    };

    helpClick = () => {
        window.open('https://github.com/tlatoza/SeeCodeRun/wiki/SeeCode.Run-Help!', '_blank');
    };

    contactUsClick = () => {
        window.open('mailto:contact@seecode.run', '_blank');
    };

    aboutClick = () => {
        window.open('https://github.com/tlatoza/SeeCodeRun/wiki/About-SeeCode.Run', '_blank');
    };

    repoClick = () => {
        window.open('https://github.com/devuxd/SeeCodeRun', '_blank');
    };

    onClick = callback => {
        return () => {
            callback && callback();
            this.handleInfoClose();
        };
    };

    handleChange = name => event => {
        this.setState({[name]: event.target.checked});
    };

    getFinalUrl = shareUrl => {
        const {checkedLocked, checkedJS, checkedHTML, checkedCSS, checkedConsole, checkedOutput} = this.state;
        if (shareUrl) {
            let query = `${
                checkedLocked ? '&locked' : ''
                }${
                checkedJS ? '&js' : ''
                }${
                checkedHTML ? '&html' : ''
                }${
                checkedCSS ? '&css' : ''
                }${
                checkedConsole ? '&console' : ''
                }${
                checkedOutput ? '&output' : ''
                }`;

            if (query) {
                query = `?custom${query}`;
            }

            return shareUrl + query;
        }
        return null;
    };

    render() {
        const {
            classes, themeType, switchTheme,
            isChatToggled, isTopNavigationToggled,
            logoClick, chatClick, chatTitle,
            showNetworkState, isNetworkOk, getNetworkStateMessage,
            shareAnchorEl, shareUrl, handleShareMenu, handleShareClose,
            shareClick, shareClipboardClick,
            resetLayoutClick,
        } = this.props;
        const shareOpen = !!shareAnchorEl;
        const {infoAnchorEl} = this.state;
        const infoOpen = !!infoAnchorEl;
        const finalUrl = this.getFinalUrl(shareUrl);
        let networkStateIcon = null;
        if (showNetworkState) {
            const networkOk = isNetworkOk();
            const networkMessage = getNetworkStateMessage();
            if (!networkOk) {
                networkStateIcon = (
                    <IconButton title={networkMessage} aria-label="Network State"
                                color="secondary">
                        <CloudOffIcon style={iconStyle}/>
                    </IconButton>);
            }
        }

        return (isTopNavigationToggled ?
                <AppBar position="sticky" color="default" elevation={2}>
                    <IconButton title={"Show toolbar"}
                                className={classes.scrIconSticky} aria-label="Menu"
                                onClick={logoClick}
                                color="default"
                    >
                        <ScrIcon {...scrSvg.sticky}/>
                    </IconButton>
                </AppBar>
                :
                <AppBar position="sticky" color="default" className={classes.appCompact} elevation={2}>
                    <Toolbar className={classes.appCompact}>
                        <IconButton title={"Hide toolbar"}
                                    className={classes.scrIcon} aria-label="Menu"
                                    onClick={logoClick}
                                    color="secondary"
                        >
                            <ScrIcon {...scrSvg.logo}/>
                        </IconButton>
                        <IconButton title={chatTitle} onClick={chatClick}
                                    color={isChatToggled ? "secondary" : "default"}>
                            <ChatIcon style={iconStyle}/>
                        </IconButton>
                        <div>
                            <IconButton
                                aria-owns={shareOpen ? 'menu-appbar' : null}
                                aria-haspopup="true"
                                onClick={handleShareMenu}
                                color={shareOpen ? "secondary" : "default"}
                                title={"Share playground"}
                            >
                                <ShareIcon style={iconStyle}/>
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={shareAnchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                open={shareOpen}
                                onClose={handleShareClose}
                            >
                                <MenuItem className={classes.centered}
                                          onClick={finalUrl && shareClick}
                                >{
                                    finalUrl ? <a href={finalUrl} target="_blank" style={aStyle.link}
                                                  onClick={e => e.preventDefault()}
                                    >
                                        {finalUrl}
                                    </a> : 'No Pastebin to Share'
                                }

                                </MenuItem>
                                {
                                    finalUrl &&
                                    <MenuItem className={classes.centered}>
                                        <FormGroup row>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={this.state.checkedLocked}
                                                        onChange={this.handleChange('checkedLocked')}
                                                        value="checkedLocked"
                                                        color="primary"
                                                    />
                                                }
                                                label="Locked"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={this.state.checkedJS}
                                                        onChange={this.handleChange('checkedJS')}
                                                        value="checkedJS"
                                                        color="primary"
                                                    />
                                                }
                                                label="JS"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={this.state.checkedHTML}
                                                        onChange={this.handleChange('checkedHTML')}
                                                        value="checkedHTML"
                                                        color="primary"
                                                    />
                                                }
                                                label="HTML"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={this.state.checkedCSS}
                                                        onChange={this.handleChange('checkedCSS')}
                                                        value="checkedCSS"
                                                        color="primary"
                                                    />
                                                }
                                                label="CSS"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={this.state.checkedConsole}
                                                        onChange={this.handleChange('checkedConsole')}
                                                        value="checkedConsole"
                                                        color="primary"
                                                    />
                                                }
                                                label="Console"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={this.state.checkedOutput}
                                                        onChange={this.handleChange('checkedOutput')}
                                                        value="checkedOutput"
                                                        color="primary"
                                                    />
                                                }
                                                label="Output"
                                            />
                                        </FormGroup>
                                    </MenuItem>
                                }

                                {
                                    finalUrl &&
                                    <CopyToClipboard
                                        onCopy={() => shareClipboardClick(finalUrl)}
                                        text={finalUrl}>
                                        <MenuItem className={classes.centered}>
                                            Copy to Clipboard
                                        </MenuItem>
                                    </CopyToClipboard>
                                }
                            </Menu>
                        </div>
                        {
                            networkStateIcon
                        }
                        <Typography variant="title" color="inherit"
                                    className={classes.flex}>
                        </Typography>
                        <IconButton
                            onClick={switchTheme}
                            title={"Switch light/dark theme"}
                        >
                            {themeType === 'darkTheme' ?
                                <LightbulbIcon {...lightBulbIconStyle.light}/>
                                : <LightbulbOutlineIcon style={iconStyle}/>
                            }
                        </IconButton>
                        <div>
                            <IconButton
                                aria-owns={infoOpen ? 'appbar-info-menu' : null}
                                aria-haspopup="true"
                                onClick={this.handleInfoMenu}
                                color={infoOpen ? "secondary" : "default"}
                                title="Info"
                            >
                                <MoreVertIcon style={iconStyle}/>
                            </IconButton>
                            <Menu
                                id="appbar-info-menu"
                                anchorEl={infoAnchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={infoOpen}
                                onClose={this.handleInfoClose}
                            >
                                <MenuItem onClick={this.onClick(resetLayoutClick)}>Reset
                                    layout</MenuItem>
                                <MenuItem onClick={this.onClick(this.helpClick)}>Help</MenuItem>
                                <MenuItem onClick={this.onClick(this.contactUsClick)}>Contact
                                    us</MenuItem>
                                <MenuItem
                                    onClick={this.onClick(this.aboutClick)}>About</MenuItem>
                                <MenuItem
                                    onClick={this.onClick(this.repoClick)}>GitHub</MenuItem>
                            </Menu>
                        </div>
                    </Toolbar>
                </AppBar>
        );
    }
}

TopNavigationBar.propTypes = {
    isNetworkOk: PropTypes.func.isRequired,
    getNetworkStateMessage: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
    switchTheme: PropTypes.func.isRequired,
};

export default withStyles(styles)(TopNavigationBar);
