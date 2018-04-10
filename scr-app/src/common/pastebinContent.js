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

const javascriptDefaultText =
    `const X = (props)=><div><span>{props.val}</span><button onClick={props.onClick}>click here</button></div>;
const onClick= e=>{console.log('click')};
ReactDOM.render(<X val="hi there!" onClick={onClick} />, document.querySelector("#root")); 
 `
;

const htmlDefaultText = `<!DOCTYPE html>
<html style="height:100%">
<!DOCTYPE html>
<html style="height:100%">
<head>
<script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
</head>
<body>
  <div id ="root"></div>
</body>
</html>
`;

const cssDefaultText =
    `html, body{
   height: 100%;
  }
  span {
    color: blue;
  }
  `;
