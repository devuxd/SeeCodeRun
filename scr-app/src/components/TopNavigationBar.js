import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import ScrIcon from '../common/icons/SCR';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChatIcon from '@mui/icons-material/Chat';
import ShareIcon from '@mui/icons-material/Share';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {themeTypes} from '../themes';
import TraceToolbar from './TraceToolbar';

let iconStyle = {};
const scrSvg = {};
const aStyle = {};

const styles = (theme) => {
        iconStyle = {
            fontSize: Math.floor(theme.typography.fontSize * 1.75),
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
                minHeight: theme.appUnits.appBarHeight,
                paddingLeft: theme.spacing(1),
                paddingRight: theme.spacing(1),
            },
            scrIconSticky: {
                position: 'absolute',
                top: 2,
                left: 4,
                zIndex: theme.zIndex.snackbar,
            },
            iconButton: {
                padding: theme.spacing(1),
            },
            flex: {
                flex: 1,
            },
            centered: {
                justifyContent: 'center',
            },
            visibleElement: {
                visibility: 'visible'
            },
            hiddenElement: {
                visibility: 'hidden'
            },
        }
    }
;

const defaultMenuProps = {
    anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
    },
    transformOrigin: {
        vertical: 'bottom',
        horizontal: 'left',
    }
};

class TopNavigationBar extends PureComponent {
    handleChangeMemos = {};

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
        global.open('https://github.com/tlatoza/SeeCodeRun/wiki/SeeCode.Run-Help!', '_blank');
    };

    contactUsClick = () => {
        global.open('mailto:contact@seecode.run', '_blank');
    };

    aboutClick = () => {
        global.open('https://github.com/tlatoza/SeeCodeRun/wiki/About-SeeCode.Run', '_blank');
    };

    repoClick = () => {
        global.open('https://github.com/devuxd/SeeCodeRun', '_blank');
    };

    onClick = callback => {
        return () => {
            callback && callback();
            this.handleInfoClose();
        };
    };

    getMemoHandleChange = name => {
        if (!this.handleChangeMemos[name]) {
            this.handleChangeMemos[name] = event => this.setState(
                {[name]: event.target.checked}
            );
        }
        return this.handleChangeMemos[name];
    };

    getFinalUrl = shareUrl => {
        const {
            checkedLocked,
            checkedJS,
            checkedHTML,
            checkedCSS,
            checkedConsole,
            checkedOutput
        } = this.state;
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

    eventPreventDefault = event => event && event.preventDefault();

    render() {
        const {
            classes, themeType, switchTheme,
            isChatToggled, isTopNavigationToggled,
            logoClick, chatClick, chatTitle,
            showNetworkState, isNetworkOk, getNetworkStateMessage,
            shareAnchorEl, shareUrl, handleShareMenu, handleShareClose,
            shareClick, shareClipboardClick,
            resetLayoutClick,
            MenuProps = defaultMenuProps,
            demo,
            handleClickDemo
        } = this.props;

        const shareOpen = !!shareAnchorEl;

        const {
            infoAnchorEl,
            checkedLocked,
            checkedJS,
            checkedHTML,
            checkedCSS,
            checkedConsole,
            checkedOutput,
        } = this.state;

        const infoOpen = !!infoAnchorEl;
        const finalUrl = this.getFinalUrl(shareUrl);
        const networkStateIcon = (
            <IconButton
                className={!isNetworkOk() && showNetworkState ?
                    classes.visibleElement
                    : classes.hiddenElement
                }

                title={showNetworkState ? getNetworkStateMessage() : ''}
                aria-label="Network State"
                color="secondary"
            >
                <CloudOffIcon style={iconStyle}/>
            </IconButton>
        );

        return (isTopNavigationToggled ?
                <AppBar position="sticky" color="default" elevation={2}>
                    <IconButton title={"Show toolbar"}
                                className={classes.scrIconSticky}
                                aria-label="Menu"
                                onClick={logoClick}
                                color="default"
                    >
                        <ScrIcon {...scrSvg.sticky}/>
                    </IconButton>
                </AppBar>
                :
                <AppBar position="sticky" color="default"
                        className={classes.appCompact} elevation={2}>
                    <Toolbar
                        variant="dense"
                        disableGutters
                    >
                        <IconButton title={"Hide toolbar"}
                                    className={classes.scrIcon}
                                    aria-label="Menu"
                                    onClick={logoClick}
                                    color="secondary"
                                    classes={{root: classes.iconButton}}
                        >
                            <ScrIcon {...scrSvg.logo}/>
                        </IconButton>
                        <IconButton title={chatTitle} onClick={chatClick}
                                    color={isChatToggled ? "secondary" : "default"}>
                            <ChatIcon style={iconStyle}/>
                        </IconButton>

                        <IconButton
                            aria-owns={shareOpen ? 'menu-appbar' : null}
                            aria-haspopup="true"
                            onClick={handleShareMenu}
                            color={shareOpen ? "secondary" : "default"}
                            title={"Share playground"}
                        >
                            <ShareIcon style={iconStyle}/>
                        </IconButton>

                        <IconButton
                            aria-owns={shareOpen ? 'menu-appbar' : null}
                            aria-haspopup="true"
                            onClick={handleClickDemo}
                            color={demo ? "secondary" : "default"}
                            title={"seeCode.rum Demo"}
                        >
                            <HelpRoundedIcon style={iconStyle}/>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={shareAnchorEl}
                            open={shareOpen}
                            onClose={handleShareClose}
                            {...MenuProps}
                        >
                            <MenuItem className={classes.centered}
                                      onClick={finalUrl && shareClick}
                            >{
                                finalUrl ?
                                    <a href={finalUrl} target="_blank"
                                       rel="noopener noreferrer"
                                       style={aStyle.link}
                                       onClick={this.eventPreventDefault}
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
                                                    checked={checkedLocked}
                                                    onChange={
                                                        this.getMemoHandleChange(
                                                            'checkedLocked'
                                                        )
                                                    }
                                                    value="checkedLocked"
                                                    color="primary"
                                                />
                                            }
                                            label="Locked"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={checkedJS}
                                                    onChange={this.getMemoHandleChange('checkedJS')}
                                                    value="checkedJS"
                                                    color="primary"
                                                />
                                            }
                                            label="JS"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={checkedHTML}
                                                    onChange={this.getMemoHandleChange('checkedHTML')}
                                                    value="checkedHTML"
                                                    color="primary"
                                                />
                                            }
                                            label="HTML"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={checkedCSS}
                                                    onChange={this.getMemoHandleChange('checkedCSS')}
                                                    value="checkedCSS"
                                                    color="primary"
                                                />
                                            }
                                            label="CSS"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={checkedConsole}
                                                    onChange={this.getMemoHandleChange('checkedConsole')}
                                                    value="checkedConsole"
                                                    color="primary"
                                                />
                                            }
                                            label="Console"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={checkedOutput}
                                                    onChange={this.getMemoHandleChange('checkedOutput')}
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
                        {
                            networkStateIcon
                        }
                        <TraceToolbar/>
                        <Typography variant="h6" color="inherit"
                                    className={classes.flex}>
                        </Typography>
                        <IconButton
                            disableRipple
                        >
                            <LightModeIcon style={
                                {...iconStyle, color: 'transparent'}
                            }/>

                        </IconButton>
                        <IconButton
                            onClick={switchTheme}
                            title={"Switch light/dark theme"}
                        >
                            {themeType === themeTypes.darkTheme ?
                                <DarkModeIcon style={iconStyle}/>
                                : <LightModeIcon style={iconStyle}/>
                            }
                        </IconButton>
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
                            <MenuItem
                                onClick={this.onClick(this.helpClick)}>Help</MenuItem>
                            <MenuItem
                                onClick={this.onClick(this.contactUsClick)}>Contact
                                us</MenuItem>
                            <MenuItem
                                onClick={this.onClick(this.aboutClick)}>About</MenuItem>
                            <MenuItem
                                onClick={this.onClick(this.repoClick)}>GitHub</MenuItem>
                        </Menu>
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
    themeType: PropTypes.string.isRequired,
    MenuProps: PropTypes.object,
    demo: PropTypes.bool.isRequired,
    handleClickDemo: PropTypes.func.isRequired,

};

// TopNavigationBar.defaultProps = {
//    MenuProps: {
//       anchorOrigin: {
//          vertical: 'top',
//          horizontal: 'right',
//       },
//       transformOrigin: {
//          vertical: 'bottom',
//          horizontal: 'left',
//       }
//    }
// };

export default withStyles(styles)(TopNavigationBar);
