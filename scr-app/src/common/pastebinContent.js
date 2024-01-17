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
// import confetti from 'https://cdn.skypack.dev/canvas-confetti';

const javascriptDefaultText = `import confetti from 'https://cdn.skypack.dev/canvas-confetti';
let array = [];
for (let i = 0; i < 10; i++) {
    array[i] = i * 100;
    array;
}
const button = document.getElementById("b");
let clickCounter = 0;
button.addEventListener("click", () => {
    button.textContent = \`Confetti thrown \${++clickCounter} times\`;
    confetti();
});
`;
//     `import React from 'https://cdn.skypack.dev/react';
// import ReactDOM from 'https://cdn.skypack.dev/react-dom';
// import { withStyles, Paper, Button } from 'https://cdn.skypack.dev/material-ui';
// import PropTypes from 'https://cdn.skypack.dev/prop-types';
//
// const styles = theme => ({
//     root: {
//         height: 700,
//     },
//     button: {
//         margin: 8,
//     },
// });
//
// let clicks =0;
// function doSomething(event) {
//     console.log(event.currentTarget.getAttribute('data-something'));
//     clicks++;
// }
//
// function FlatButtons(props) {
//     const { classes } = props;
//     return (
//         <Paper className={classes.root}>
//             <Button className={classes.button} onClick={doSomething} data-something="Default">
//                 Default</Button>
//             <Button className={classes.button} onClick={doSomething} data-something="Primary">
//                 Primary
//             </Button>
//                 <Button color="secondary" className={classes.button} onClick={doSomething} data-something="Secondary">
//                     Secondary
//             </Button>
//                 <Button disabled className={classes.button} onClick={doSomething} data-something="Disabled">
//                     Disabled
//             </Button>
//             <Button className={classes.button} onClick={doSomething} data-something="Disabled">
//                     Disabled
//             </Button>
//             <Button disabled href="/" className={classes.button} onClick={doSomething} data-something="Default">
//                     Link disabled
//             </Button>
//         </Paper>
//     );
// }
//
// const App = withStyles(styles)(FlatButtons);
// ReactDOM.render(<App />, document.querySelector("#root"));
// `;

const htmlDefaultText = `<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
</head>
<body>
	<div id="root">
	     <button id="b">
            Click me!
         </button>
    </div>
</body>
</html>
`;
// `<!DOCTYPE html>
// <html>
// <head>
// 	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
// </head>
// <body>
// 	<div id="root"></div>
// </body>
// </html>
// `;

const cssDefaultText = `html, body{
  margin:0;
}
`;
