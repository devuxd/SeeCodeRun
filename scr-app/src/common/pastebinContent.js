// module.exports = function getDefaultTextForLanguage(language) {
export function getDefaultTextForLanguage(language) {
    switch (language) {
        case 'javascript':
            return javascriptDefaultText;
        case 'js':
            return javascriptDefaultText;
        case 'css':
            return cssDefaultText;
        case 'html':
            return htmlDefaultText;
        default:
            return htmlDefaultText;
    }
// };
}

const javascriptDefaultText = `import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles, Paper, Button } from 'material-ui';
import PropTypes from 'prop-types';

const styles = theme => ({
    root: {
        height: 700,
    },
    button: {
        margin: theme.spacing.unit,
    },
});

let clicks =0;
function doSomething(event) {
    console.log(event.currentTarget.getAttribute('data-something'));
    clicks++;
}

function FlatButtons(props) {
    const { classes } = props;
    return (
        <Paper className={classes.root}>
            <Button className={classes.button} onClick={doSomething} data-something="Default">
                Default</Button>
            <Button color="primary" className={classes.button} onClick={doSomething} data-something="Primary">
                Primary
            </Button>
                <Button color="secondary" className={classes.button} onClick={doSomething} data-something="Secondary">
                    Secondary
            </Button>
                <Button disabled className={classes.button} onClick={doSomething} data-something="Disabled">
                    Disabled
            </Button>
            <Button className={classes.button} onClick={doSomething} data-something="Disabled">
                    Disabled
            </Button>
            <Button disabled href="/" className={classes.button} onClick={doSomething} data-something="Default">
                    Link disabled
            </Button>
        </Paper>
    );
}

const App = withStyles(styles)(FlatButtons);
ReactDOM.render(<App />, document.querySelector("#root"));
`;

const htmlDefaultText = `<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
</head>
<body>
	<div id="root"></div>
</body>
</html>
`;

const cssDefaultText = `html, body{
  margin:0;
}
`;
