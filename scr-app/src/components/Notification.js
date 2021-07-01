import React, {useState} from 'react';
import {withStyles} from '@material-ui/styles';
import CloseIcon from '@material-ui/icons/Close';
// import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';

function TransitionUp(props) {
    return <Slide {...props} direction="up"/>;
}

function TransitionDown(props) {
    return <Slide {...props} direction="down"/>;
}

const styles = () => ({
    snackbar: {},
    snackbarContent: {
        maxWidth: 'inherit',
        width: '100%',
    },
});

function Notification(
    {type = 'error', message, classes, onClose, vertical = 'bottom', horizontal = 'right'}) {
    const [open, setOpen] = useState(true);
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        onClose && onClose(event, reason, false);
    };
    return <Snackbar
        anchorOrigin={{vertical, horizontal}}
        TransitionComponent={open ? TransitionUp : TransitionDown}
        open={open}
        onClose={handleClose}
        ContentProps={{
            'aria-describedby': 'snackbar-fab-message-id',
            className: classes.snackbarContent,
        }}
        message={<span id="snackbar-fab-message-id"><ErrorIcon
            color="error"/><span>{JSON.stringify(message)}</span></span>}
        action={
            <Button size="small" color="inherit" onClick={handleClose}>
                <CloseIcon/>
            </Button>
        }
        className={classes.snackbar}
    />
}

export default withStyles(styles)(Notification);
